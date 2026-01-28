import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BusinessServiceDto,
  BusinessServicePackDto,
  ActivateServiceDto,
  UpdateBusinessServiceDto,
  TokenPayload,
  UserRole,
} from '@contracts/core';

@Injectable()
export class BusinessServicesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Activate a service for a business and select packs
   * Enforces tenant isolation: user must belong to the business
   */
  async activateService(
    businessId: string,
    dto: ActivateServiceDto,
    user: TokenPayload,
  ): Promise<BusinessServiceDto> {
    // Validate business ownership (tenant isolation)
    if (user.role !== UserRole.SUPER_ADMIN) {
      if (!user.businessId || user.businessId !== businessId) {
        throw new ForbiddenException('Access denied');
      }
    }

    // Verify business exists
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    // Verify service exists and is published
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${dto.serviceId} not found`);
    }

    if (!service.isPublished) {
      throw new BadRequestException('Service is not published and cannot be activated');
    }

    if (!service.isActive) {
      throw new BadRequestException('Service is not active and cannot be activated');
    }

    // Validate that only one pack is selected
    if (dto.packIds.length !== 1) {
      throw new BadRequestException('A business can only activate one pack per service');
    }

    // Verify the pack exists and belongs to this service
    const servicePack = await this.prisma.servicePack.findFirst({
      where: {
        serviceId: dto.serviceId,
        packId: dto.packIds[0],
      },
      include: {
        pack: true,
      },
    });

    if (!servicePack) {
      throw new BadRequestException(
        `Pack does not exist or does not belong to this service`,
      );
    }

    // Check if service is already activated
    const existingBusinessService = await this.prisma.businessService.findUnique({
      where: {
        businessId_serviceId: {
          businessId,
          serviceId: dto.serviceId,
        },
      },
    });

    if (existingBusinessService) {
      throw new BadRequestException('Service is already activated for this business');
    }

    // Create BusinessService and BusinessServicePacks in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const businessService = await tx.businessService.create({
        data: {
          businessId,
          serviceId: dto.serviceId,
          isActive: true,
        },
      });

      // Create single BusinessServicePack (only one pack per service)
      const businessServicePack = await tx.businessServicePack.create({
        data: {
          businessServiceId: businessService.id,
          packId: dto.packIds[0],
          isActive: true,
        },
      });

      return { businessService, businessServicePack };
    });

    // Fetch the created pack with details
    const createdPack = await this.prisma.businessServicePack.findUnique({
      where: { id: result.businessServicePack.id },
      include: {
        pack: true,
        nextPack: true,
      },
    });

    return this.mapBusinessServiceToDto(
      result.businessService,
      service,
      createdPack ? [createdPack] : [],
    );
  }

  /**
   * Deactivate a service for a business
   */
  async deactivateService(
    businessId: string,
    serviceId: string,
    user: TokenPayload,
  ): Promise<void> {
    // Validate business ownership (tenant isolation)
    if (user.role !== UserRole.SUPER_ADMIN) {
      if (!user.businessId || user.businessId !== businessId) {
        throw new ForbiddenException('Access denied');
      }
    }

    const businessService = await this.prisma.businessService.findUnique({
      where: {
        businessId_serviceId: {
          businessId,
          serviceId,
        },
      },
    });

    if (!businessService) {
      throw new NotFoundException('Service is not activated for this business');
    }

    await this.prisma.businessService.update({
      where: { id: businessService.id },
      data: { isActive: false },
    });
  }

  /**
   * Update service activation (toggle active status or update packs)
   * BUSINESS_ADMIN can only change packs (which take effect next service day)
   * SUPER_ADMIN can change packs immediately and toggle isActive
   */
  async updateService(
    businessId: string,
    serviceId: string,
    dto: UpdateBusinessServiceDto,
    user: TokenPayload,
  ): Promise<BusinessServiceDto> {
    // Validate business ownership (tenant isolation)
    if (user.role !== UserRole.SUPER_ADMIN) {
      if (!user.businessId || user.businessId !== businessId) {
        throw new ForbiddenException('Access denied');
      }
    }

    const businessService = await this.prisma.businessService.findUnique({
      where: {
        businessId_serviceId: {
          businessId,
          serviceId,
        },
      },
      include: {
        service: true,
      },
    });

    if (!businessService) {
      throw new NotFoundException('Service is not activated for this business');
    }

    // BUSINESS_ADMIN can only change packs, not isActive
    if (user.role === UserRole.BUSINESS_ADMIN) {
      if (dto.isActive !== undefined) {
        throw new ForbiddenException('Only SUPER_ADMIN can change service activation status');
      }
    }

    // Update isActive if provided (SUPER_ADMIN only)
    if (dto.isActive !== undefined && user.role === UserRole.SUPER_ADMIN) {
      await this.prisma.businessService.update({
        where: { id: businessService.id },
        data: { isActive: dto.isActive },
      });
    }

    // Update packs if provided
    if (dto.packIds !== undefined) {
      // Validate that only one pack is selected
      if (dto.packIds.length !== 1) {
        throw new BadRequestException('A business can only activate one pack per service');
      }

      // Verify the pack exists and belongs to this service
      const servicePack = await this.prisma.servicePack.findFirst({
        where: {
          serviceId,
          packId: dto.packIds[0],
        },
      });

      if (!servicePack) {
        throw new BadRequestException(
          `Pack does not exist or does not belong to this service`,
        );
      }

      const newPackId = dto.packIds[0];
      const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;

      // Get current active pack
      const currentPack = await this.prisma.businessServicePack.findFirst({
        where: {
          businessServiceId: businessService.id,
          isActive: true,
        },
      });

      // If pack is already active, no change needed
      if (currentPack && currentPack.packId === newPackId) {
        // Clear any pending changes
        await this.prisma.businessServicePack.updateMany({
          where: { businessServiceId: businessService.id },
          data: { nextPackId: null, effectiveDate: null },
        });
      } else {
        if (isSuperAdmin) {
          // SUPER_ADMIN: Apply pack change immediately
          await this.prisma.$transaction(async (tx) => {
            // Deactivate all existing packs
            await tx.businessServicePack.updateMany({
              where: { businessServiceId: businessService.id },
              data: { isActive: false, nextPackId: null, effectiveDate: null },
            });

            // Activate the selected pack (create if not exists, update if exists)
            await tx.businessServicePack.upsert({
              where: {
                businessServiceId_packId: {
                  businessServiceId: businessService.id,
                  packId: newPackId,
                },
              },
              create: {
                businessServiceId: businessService.id,
                packId: newPackId,
                isActive: true,
              },
              update: {
                isActive: true,
                nextPackId: null,
                effectiveDate: null,
              },
            });
          });
        } else {
          // BUSINESS_ADMIN: Schedule pack change for next service day (tomorrow)
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);

          await this.prisma.$transaction(async (tx) => {
            // Update current pack to have pending change
            if (currentPack) {
              await tx.businessServicePack.update({
                where: { id: currentPack.id },
                data: {
                  nextPackId: newPackId,
                  effectiveDate: tomorrow,
                },
              });
            } else {
              // No current pack, create one with pending change
              await tx.businessServicePack.create({
                data: {
                  businessServiceId: businessService.id,
                  packId: newPackId, // Will be the pack starting tomorrow
                  isActive: false, // Not active yet
                  nextPackId: newPackId,
                  effectiveDate: tomorrow,
                },
              });
            }
          });
        }
      }
    }

    // Apply pending pack changes before fetching
    await this.applyPendingPackChanges(businessId);

    // Fetch updated business service with packs
    const updated = await this.prisma.businessService.findUnique({
      where: { id: businessService.id },
      include: {
        service: true,
        businessServicePacks: {
          where: {
            isActive: true,
          },
          include: {
            pack: true,
            nextPack: true,
          },
        },
      },
    });

    return this.mapBusinessServiceToDto(
      updated!,
      updated!.service,
      updated!.businessServicePacks,
    );
  }

  /**
   * Apply pending pack changes that are effective today or earlier
   */
  private async applyPendingPackChanges(businessId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all business service packs with pending changes that are effective today or earlier
    const pendingChanges = await this.prisma.businessServicePack.findMany({
      where: {
        businessService: {
          businessId,
        },
        nextPackId: { not: null },
        effectiveDate: { lte: today },
      },
      include: {
        businessService: true,
      },
    });

    if (pendingChanges.length === 0) {
      return;
    }

    // Apply each pending change
    await this.prisma.$transaction(async (tx) => {
      for (const pendingChange of pendingChanges) {
        if (!pendingChange.nextPackId) continue;

        // Deactivate current pack
        await tx.businessServicePack.update({
          where: { id: pendingChange.id },
          data: {
            isActive: false,
            nextPackId: null,
            effectiveDate: null,
          },
        });

        // Activate the new pack
        await tx.businessServicePack.upsert({
          where: {
            businessServiceId_packId: {
              businessServiceId: pendingChange.businessServiceId,
              packId: pendingChange.nextPackId,
            },
          },
          create: {
            businessServiceId: pendingChange.businessServiceId,
            packId: pendingChange.nextPackId,
            isActive: true,
            nextPackId: null,
            effectiveDate: null,
          },
          update: {
            isActive: true,
            nextPackId: null,
            effectiveDate: null,
          },
        });
      }
    });
  }

  /**
   * Get all activated services for a business
   */
  async getBusinessServices(
    businessId: string,
    user: TokenPayload,
  ): Promise<BusinessServiceDto[]> {
    // Validate business ownership (tenant isolation)
    if (user.role !== UserRole.SUPER_ADMIN) {
      if (!user.businessId || user.businessId !== businessId) {
        throw new ForbiddenException('Access denied');
      }
    }

    // Apply pending pack changes that are effective today or earlier
    await this.applyPendingPackChanges(businessId);

    const businessServices = await this.prisma.businessService.findMany({
      where: { businessId },
      include: {
        service: true,
        businessServicePacks: {
          where: {
            isActive: true,
          },
          include: {
            pack: true,
            nextPack: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return businessServices.map((bs) =>
      this.mapBusinessServiceToDto(bs, bs.service, bs.businessServicePacks),
    );
  }

  /**
   * Get a specific service activation for a business
   */
  async getBusinessService(
    businessId: string,
    serviceId: string,
    user: TokenPayload,
  ): Promise<BusinessServiceDto> {
    // Validate business ownership (tenant isolation)
    if (user.role !== UserRole.SUPER_ADMIN) {
      if (!user.businessId || user.businessId !== businessId) {
        throw new ForbiddenException('Access denied');
      }
    }

    // Apply pending pack changes that are effective today or earlier
    await this.applyPendingPackChanges(businessId);

    const businessService = await this.prisma.businessService.findUnique({
      where: {
        businessId_serviceId: {
          businessId,
          serviceId,
        },
      },
      include: {
        service: true,
        businessServicePacks: {
          where: {
            isActive: true,
          },
          include: {
            pack: true,
            nextPack: true,
          },
        },
      },
    });

    if (!businessService) {
      throw new NotFoundException('Service is not activated for this business');
    }

    return this.mapBusinessServiceToDto(
      businessService,
      businessService.service,
      businessService.businessServicePacks,
    );
  }

  private mapBusinessServiceToDto(
    businessService: any,
    service: any,
    businessServicePacks: any[],
  ): BusinessServiceDto {
    return {
      id: businessService.id,
      businessId: businessService.businessId,
      serviceId: businessService.serviceId,
      serviceName: service.name,
      serviceDescription: service.description || undefined,
      isActive: businessService.isActive,
      packs: businessServicePacks.map((bsp) => this.mapBusinessServicePackToDto(bsp)),
      createdAt: businessService.createdAt.toISOString(),
      updatedAt: businessService.updatedAt.toISOString(),
    };
  }

  private mapBusinessServicePackToDto(businessServicePack: any): BusinessServicePackDto {
    return {
      id: businessServicePack.id,
      packId: businessServicePack.packId,
      packName: businessServicePack.pack.name,
      packPrice: Number(businessServicePack.pack.price),
      isActive: businessServicePack.isActive,
      nextPackId: businessServicePack.nextPackId || undefined,
      nextPackName: businessServicePack.nextPack?.name || undefined,
      effectiveDate: businessServicePack.effectiveDate
        ? businessServicePack.effectiveDate.toISOString().split('T')[0]
        : undefined,
      createdAt: businessServicePack.createdAt.toISOString(),
      updatedAt: businessServicePack.updatedAt.toISOString(),
    };
  }
}
