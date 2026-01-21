import { DailyMenuWithDetailsDto } from '@contracts/core';
import Link from 'next/link';

interface LockedStateSummaryProps {
  dailyMenu: DailyMenuWithDetailsDto;
}

export function LockedStateSummary({ dailyMenu }: LockedStateSummaryProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Menu Summary</h2>
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Total Orders</h3>
          <p className="text-gray-600">Orders will be displayed here when available</p>
        </div>
        <div>
          <h3 className="font-medium mb-2">Variant Quantity Summary</h3>
                <div className="space-y-2">
                  {dailyMenu.variants.map((v) => (
                    <div key={v.id} className="flex justify-between text-sm">
                      <span>
                        {v.variantName} (Food Component: {v.componentName})
                      </span>
                      <span className="font-medium">{v.initialStock}</span>
                    </div>
                  ))}
                </div>
        </div>
        <Link
          href={`/kitchen?date=${dailyMenu.date}`}
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          View Kitchen Summary
        </Link>
      </div>
    </div>
  );
}
