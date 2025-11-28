import { BaseExporter } from './BaseExporter';
import { TrendItem } from '../types';
import moment from 'moment';

export class JSONExporter extends BaseExporter {
  protected formatData(items: TrendItem[], processedData?: any): string {
    // 如果 processedData 包含多平台数据（allPlatformData），使用合并格式
    if (processedData?.allPlatformData && Array.isArray(processedData.allPlatformData)) {
      const dateStr = moment().format('YYYY-MM-DD');
      const allPlatformData = processedData.allPlatformData;
      
      const mergedData = {
        timestamp: new Date().toISOString(),
        date: dateStr,
        totalPlatforms: allPlatformData.length,
        totalItems: processedData.totalItems || items.length,
        platforms: allPlatformData.map((platformData: any) => ({
          platformName: platformData.platformName,
          itemCount: platformData.items.length,
          items: platformData.items.map((item: TrendItem) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            url: item.url,
            source: item.source,
            timestamp: item.timestamp,
            metadata: item.metadata,
          })),
        })),
      };

      return JSON.stringify(mergedData, null, 2);
    }

    // 默认格式（与其他 pipeline 一致）
    const exportData = {
      timestamp: new Date().toISOString(),
      totalItems: items.length,
      items: items,
      processedData: processedData,
    };

    return JSON.stringify(exportData, null, 2);
  }
}