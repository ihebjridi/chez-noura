import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ServiceDto,
  ServiceWithPacksDto,
  ServicePackDto,
  CreateServiceDto,
  UpdateServiceDto,
  TokenPayload,
  UserRole,
} from '@contracts/core';
import { Prisma } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new service
   * Only SUPER_ADMIN can create services
   */
  async create(createServiceDto: CreateServiceDto, user: TokenPayload): Promise<ServiceDto> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can create services');
    }

    // Validate time formats if provided
    if (createServiceDto.orderStartTime && !this.isValidTimeFormat(createServiceDto.orderStartTime)) {
      throw new BadRequestException('orderStartTime must be in HH:MM format (24-hour)');
    }
    if (createServiceDto.cutoffTime && !this.isValidTimeFormat(createServiceDto.cutoffTime)) {
      throw new BadRequestException('cutoffTime must be in HH:MM format (24-hour)');
    }

    const service = await this.prisma.service.create({
      data: {
        name: createServiceDto.name,
        description: createServiceDto.description,
        isActive: createServiceDto.isActive ?? true,
        isPublished: createServiceDto.isPublished ?? false,
        orderStartTime: createServiceDto.orderStartTime || null,
        cutoffTime: createServiceDto.cutoffTime || null,
      },
    });

    return this.mapServiceToDto(service);
  }

  /**
   * Get all services
   * SUPER_ADMIN sees all, BUSINESS_ADMIN sees only published and active services, EMPLOYEE sees only published and active services
   */
  async findAll(user?: TokenPayload): Promise<ServiceDto[]> {
    const where: Prisma.ServiceWhereInput = {};

    // BUSINESS_ADMIN and EMPLOYEE see only published and active services
    if (user && user.role !== UserRole.SUPER_ADMIN) {
      where.isActive = true;
      where.isPublished = true;
    }

    const services = await this.prisma.service.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });

    return services.map((service) => this.mapServiceToDto(service));
  }

  /**
   * Get a service by ID with its packs
   * BUSINESS_ADMIN and EMPLOYEE can only see published and active services
   */
  async findOne(id: string, user?: TokenPayload): Promise<ServiceWithPacksDto> {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        servicePacks: {
          include: {
            pack: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    // BUSINESS_ADMIN and EMPLOYEE can only see published and active services
    if (user && user.role !== UserRole.SUPER_ADMIN) {
      if (!service.isActive || !service.isPublished) {
        throw new NotFoundException(`Service with ID ${id} not found`);
      }
    }

    return this.mapServiceWithPacksToDto(service);
  }

  /**
   * Update a service
   * Only SUPER_ADMIN can update services
   */
  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
    user: TokenPayload,
  ): Promise<ServiceDto> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can update services');
    }

    const existingService = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const updateData: Prisma.ServiceUpdateInput = {};

    if (updateServiceDto.name !== undefined) {
      updateData.name = updateServiceDto.name;
    }

    if (updateServiceDto.description !== undefined) {
      updateData.description = updateServiceDto.description;
    }

    if (updateServiceDto.isActive !== undefined) {
      updateData.isActive = updateServiceDto.isActive;
    }

    if (updateServiceDto.isPublished !== undefined) {
      updateData.isPublished = updateServiceDto.isPublished;
    }

    // Validate and update time fields if provided
    if (updateServiceDto.orderStartTime !== undefined) {
      if (updateServiceDto.orderStartTime && !this.isValidTimeFormat(updateServiceDto.orderStartTime)) {
        throw new BadRequestException('orderStartTime must be in HH:MM format (24-hour)');
      }
      updateData.orderStartTime = updateServiceDto.orderStartTime || null;
    }

    if (updateServiceDto.cutoffTime !== undefined) {
      if (updateServiceDto.cutoffTime && !this.isValidTimeFormat(updateServiceDto.cutoffTime)) {
        throw new BadRequestException('cutoffTime must be in HH:MM format (24-hour)');
      }
      updateData.cutoffTime = updateServiceDto.cutoffTime || null;
    }

    const updatedService = await this.prisma.service.update({
      where: { id },
      data: updateData,
    });

    return this.mapServiceToDto(updatedService);
  }

  /**
   * Add a pack to a service
   * Only SUPER_ADMIN can add packs to services
   * Enforces: pack can only belong to one service
   */
  async addPack(serviceId: string, packId: string, user: TokenPayload): Promise<ServicePackDto> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can add packs to services');
    }

    // Verify service exists
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    // Verify pack exists
    const pack = await this.prisma.pack.findUnique({
      where: { id: packId },
    });

    if (!pack) {
      throw new NotFoundException(`Pack with ID ${packId} not found`);
    }

    // Check if pack already belongs to another service
    const existingServicePack = await this.prisma.servicePack.findUnique({
      where: { packId },
    });

    if (existingServicePack) {
      if (existingServicePack.serviceId === serviceId) {
        throw new BadRequestException('Pack is already in this service');
      } else {
        throw new BadRequestException('Pack already belongs to another service');
      }
    }

    const servicePack = await this.prisma.servicePack.create({
      data: {
        serviceId,
        packId,
      },
      include: {
        pack: true,
      },
    });

    return this.mapServicePackToDto(servicePack);
  }

  /**
   * Remove a pack from a service
   * Only SUPER_ADMIN can remove packs from services
   */
  async removePack(serviceId: string, packId: string, user: TokenPayload): Promise<void> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can remove packs from services');
    }

    const servicePack = await this.prisma.servicePack.findFirst({
      where: {
        serviceId,
        packId,
      },
    });

    if (!servicePack) {
      throw new NotFoundException('Pack is not in this service');
    }

    await this.prisma.servicePack.delete({
      where: { id: servicePack.id },
    });
  }

  /**
   * Delete a service
   * Only SUPER_ADMIN can delete services
   * Cannot delete if service has active business services
   * ServicePacks and BusinessServices will be cascade deleted
   * Invoices will have their serviceId set to null
   */
  async delete(id: string, user: TokenPayload): Promise<void> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can delete services');
    }

    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        businessServices: {
          where: { isActive: true },
        },
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    // Prevent deletion if there are active business services
    if (service.businessServices.length > 0) {
      throw new BadRequestException(
        `Cannot delete service: it has ${service.businessServices.length} active business service(s). Please deactivate all business services before deleting.`,
      );
    }

    // Delete the service
    // ServicePacks and BusinessServices will be cascade deleted automatically
    // Invoices will have their serviceId set to null automatically
    await this.prisma.service.delete({
      where: { id },
    });
  }

  private mapServiceToDto(service: any): ServiceDto {
    return {
      id: service.id,
      name: service.name,
      description: service.description || undefined,
      isActive: service.isActive,
      isPublished: service.isPublished,
      orderStartTime: service.orderStartTime || undefined,
      cutoffTime: service.cutoffTime || undefined,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    };
  }

  /**
   * Validate time format (HH:MM in 24-hour format)
   */
  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  private mapServiceWithPacksToDto(service: any): ServiceWithPacksDto {
    return {
      ...this.mapServiceToDto(service),
      packs: service.servicePacks.map((sp: any) => this.mapServicePackToDto(sp)),
    };
  }

  private mapServicePackToDto(servicePack: any): ServicePackDto {
    return {
      id: servicePack.id,
      serviceId: servicePack.serviceId,
      packId: servicePack.packId,
      packName: servicePack.pack.name,
      packPrice: Number(servicePack.pack.price),
      createdAt: servicePack.createdAt.toISOString(),
      updatedAt: servicePack.updatedAt.toISOString(),
    };
  }
}
