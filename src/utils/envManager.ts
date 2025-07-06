import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * 环境变量管理器
 * 提供重新加载 .env 文件的功能，确保获取最新的环境变量
 */
export class EnvManager {
  private static instance: EnvManager;
  private envPath: string;

  private constructor() {
    this.envPath = join(process.cwd(), '.env');
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): EnvManager {
    if (!EnvManager.instance) {
      EnvManager.instance = new EnvManager();
    }
    return EnvManager.instance;
  }

  /**
   * 重新加载环境变量
   * @param envPath 可选的 .env 文件路径，默认为项目根目录的 .env
   */
  public reloadEnvVars(envPath?: string): void {
    const targetPath = envPath || this.envPath;
    
    try {
      if (!existsSync(targetPath)) {
        console.warn(`环境变量文件不存在: ${targetPath}`);
        return;
      }

      const envContent = readFileSync(targetPath, 'utf-8');
      
      // 解析并设置环境变量
      const envLines = envContent.split('\n');
      envLines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            process.env[key.trim()] = value.trim();
          }
        }
      });

      console.log(`✅ 环境变量已重新加载: ${targetPath}`);
    } catch (error) {
      console.error('❌ 重新加载环境变量失败:', error);
    }
  }

  /**
   * 获取环境变量值，如果不存在则返回默认值
   * @param key 环境变量键名
   * @param defaultValue 默认值
   */
  public getEnv(key: string, defaultValue?: string): string | undefined {
    return process.env[key] || defaultValue;
  }

  /**
   * 获取必需的环境变量，如果不存在则抛出错误
   * @param key 环境变量键名
   */
  public getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`必需的环境变量 ${key} 未设置`);
    }
    return value;
  }

  /**
   * 检查环境变量是否存在
   * @param key 环境变量键名
   */
  public hasEnv(key: string): boolean {
    return !!process.env[key];
  }

  /**
   * 打印当前环境变量（用于调试）
   * @param keys 要打印的键名数组，如果不提供则打印所有
   */
  public printEnvVars(keys?: string[]): void {
    if (keys) {
      console.log('当前环境变量:');
      keys.forEach(key => {
        const value = process.env[key];
        console.log(`  ${key}: ${value || '(未设置)'}`);
      });
    } else {
      console.log('所有环境变量:', process.env);
    }
  }
}

// 导出便捷函数
export const reloadEnvVars = (envPath?: string) => EnvManager.getInstance().reloadEnvVars(envPath);
export const getEnv = (key: string, defaultValue?: string) => EnvManager.getInstance().getEnv(key, defaultValue);
export const getRequiredEnv = (key: string) => EnvManager.getInstance().getRequiredEnv(key);
export const hasEnv = (key: string) => EnvManager.getInstance().hasEnv(key); 