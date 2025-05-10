/**
 * 간단한 메모리 캐시 구현
 * 캐시 만료 시간을 설정하여 데이터를 캐싱하고, 요청 시 캐시에서 데이터를 가져옵니다.
 */

interface CacheItem<T> {
  data: T;
  expiry: number;
}

class MemoryCache {
  private cache: Map<string, CacheItem<any>>;
  private defaultTTL: number;

  constructor(defaultTTL = 5 * 60 * 1000) { // 기본 5분 캐시
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * 캐시에서 데이터를 가져옵니다.
   * @param key 캐시 키
   * @returns 캐시된 데이터 또는 undefined (캐시가 없거나 만료된 경우)
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    // 캐시가 없는 경우
    if (!item) {
      return undefined;
    }
    
    // 캐시가 만료된 경우
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.data as T;
  }

  /**
   * 데이터를 캐시에 저장합니다.
   * @param key 캐시 키
   * @param data 저장할 데이터
   * @param ttl 캐시 만료 시간 (밀리초)
   */
  set<T>(key: string, data: T, ttl = this.defaultTTL): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { data, expiry });
  }

  /**
   * 특정 키의 캐시를 삭제합니다.
   * @param key 삭제할 캐시 키
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 특정 접두사로 시작하는 모든 캐시를 삭제합니다.
   * @param prefix 캐시 키 접두사
   */
  deleteByPrefix(prefix: string): void {
    // Array.from을 사용하여 반복문 호환성 문제 해결
    Array.from(this.cache.keys()).forEach(key => {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * 모든 캐시를 초기화합니다.
   */
  clear(): void {
    this.cache.clear();
  }
}

// 싱글톤 인스턴스 생성
const cache = new MemoryCache();

export default cache;