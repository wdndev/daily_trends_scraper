import { BaseExporter } from './BaseExporter';
import { TrendItem } from '../types';

export class JSONExporter extends BaseExporter {
  protected formatData(items: TrendItem[], processedData?: any): string {
    const exportData = {
      timestamp: new Date().toISOString(),
      totalItems: items.length,
      items: items,
      processedData: processedData,
    };

    return JSON.stringify(exportData, null, 2);
  }
} 