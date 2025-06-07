import { Loader } from '@googlemaps/js-api-loader';

export interface PlaceResult {
  name: string;
  address: string;
  distance: string;
  duration: string;
  lat: number;
  lng: number;
  placeId?: string;
}

export interface HotelLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

class GoogleMapsService {
  private loader: Loader;
  private map: google.maps.Map | null = null;
  private service: google.maps.places.PlacesService | null = null;
  private distanceService: google.maps.DistanceMatrixService | null = null;

  constructor() {
    // Loader는 초기화 시에 생성하지 않고 필요할 때 생성
    this.loader = null as any;
  }

  private async getApiKey(): Promise<string> {
    // 클라이언트 환경변수에서 먼저 확인
    if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      return import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    }
    
    // 서버에서 API 키 가져오기
    try {
      const response = await fetch('/api/config/google-maps');
      if (response.ok) {
        const data = await response.json();
        return data.apiKey || '';
      }
    } catch (error) {
      console.error('Failed to fetch Google Maps API key from server:', error);
    }
    
    console.error('Google Maps API key not found');
    return '';
  }

  async initialize(): Promise<void> {
    if (!this.loader) {
      const apiKey = await this.getApiKey();
      this.loader = new Loader({
        apiKey: apiKey,
        version: 'weekly',
        libraries: ['places']
      });
    }
    await this.loader.load();
    
    // 지도 컨테이너 생성 (화면에 표시되지 않음)
    const mapDiv = document.createElement('div');
    mapDiv.style.display = 'none';
    document.body.appendChild(mapDiv);
    
    this.map = new google.maps.Map(mapDiv, {
      center: { lat: 35.6762, lng: 139.6503 }, // 도쿄 기본 위치
      zoom: 15
    });
    
    this.service = new google.maps.places.PlacesService(this.map);
    this.distanceService = new google.maps.DistanceMatrixService();
  }

  async geocodeAddress(address: string): Promise<HotelLocation | null> {
    if (!window.google) {
      await this.initialize();
    }

    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder();
      
      // 일본 지역으로 제한하고 정확한 주소를 우선시
      const geocodeRequest: google.maps.GeocoderRequest = {
        address: address,
        componentRestrictions: {
          country: 'JP' // 일본으로 제한
        },
        region: 'jp' // 일본 지역 우선
      };
      
      geocoder.geocode(geocodeRequest, (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          // 가장 구체적인 주소 결과를 찾기 위해 정렬
          const sortedResults = results.sort((a, b) => {
            // 더 많은 주소 구성요소를 가진 것을 우선시
            const aComponents = a.address_components.length;
            const bComponents = b.address_components.length;
            
            // premise, street_number, route가 있는 것을 우선시
            const aHasSpecific = a.address_components.some(comp => 
              comp.types.includes('premise') || 
              comp.types.includes('street_number') ||
              comp.types.includes('establishment')
            );
            const bHasSpecific = b.address_components.some(comp => 
              comp.types.includes('premise') || 
              comp.types.includes('street_number') ||
              comp.types.includes('establishment')
            );
            
            if (aHasSpecific && !bHasSpecific) return -1;
            if (!aHasSpecific && bHasSpecific) return 1;
            
            return bComponents - aComponents;
          });
          
          const bestResult = sortedResults[0];
          const location = bestResult.geometry.location;
          
          resolve({
            name: address,
            address: bestResult.formatted_address,
            lat: location.lat(),
            lng: location.lng()
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  async findNearbyPlaces(
    location: { lat: number; lng: number },
    type: string,
    keyword: string
  ): Promise<PlaceResult[]> {
    if (!this.service) {
      await this.initialize();
    }

    return new Promise((resolve) => {
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(location.lat, location.lng),
        radius: 1000, // 1km 반경
        keyword: keyword,
        type: type as any
      };

      this.service!.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          // 결과를 거리순으로 정렬하기 위해 좌표 계산
          const sortedResults = results
            .filter(place => place.geometry?.location)
            .map(place => {
              const placeLocation = place.geometry!.location!;
              const distance = this.calculateDistance(
                location.lat, location.lng,
                placeLocation.lat(), placeLocation.lng()
              );
              return { place, distance };
            })
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5) // TOP 5만 선택
            .map(({ place }) => ({
              name: place.name || '이름 없음',
              address: place.vicinity || place.formatted_address || '주소 정보 없음',
              distance: '',
              duration: '',
              lat: place.geometry!.location!.lat(),
              lng: place.geometry!.location!.lng(),
              placeId: place.place_id
            }));

          resolve(sortedResults);
        } else {
          resolve([]);
        }
      });
    });
  }

  async findAllConvenienceStores(location: { lat: number; lng: number }): Promise<PlaceResult[]> {
    if (!this.service) {
      await this.initialize();
    }

    // 모든 편의점을 찾기 위한 통합 검색
    return new Promise((resolve) => {
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(location.lat, location.lng),
        radius: 1500, // 1.5km 반경으로 확장
        type: 'convenience_store' as any
      };

      this.service!.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          // 모든 편의점 결과를 거리순으로 정렬
          const allConvenienceStores = results
            .filter(place => place.geometry?.location && place.name)
            .map(place => {
              const placeLocation = place.geometry!.location!;
              const distance = this.calculateDistance(
                location.lat, location.lng,
                placeLocation.lat(), placeLocation.lng()
              );
              return { place, distance };
            })
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 10) // 더 많은 결과에서 선택
            .map(({ place }) => ({
              name: place.name || '이름 없음',
              address: place.vicinity || place.formatted_address || '주소 정보 없음',
              distance: '',
              duration: '',
              lat: place.geometry!.location!.lat(),
              lng: place.geometry!.location!.lng(),
              placeId: place.place_id
            }));

          resolve(allConvenienceStores);
        } else {
          resolve([]);
        }
      });
    });
  }

  async calculateDistances(
    origin: { lat: number; lng: number },
    destinations: PlaceResult[]
  ): Promise<PlaceResult[]> {
    if (!this.distanceService || destinations.length === 0) {
      return destinations;
    }

    return new Promise((resolve) => {
      const destinationLatLngs = destinations.map(dest => 
        new google.maps.LatLng(dest.lat, dest.lng)
      );

      this.distanceService!.getDistanceMatrix({
        origins: [new google.maps.LatLng(origin.lat, origin.lng)],
        destinations: destinationLatLngs,
        travelMode: google.maps.TravelMode.WALKING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      }, (response, status) => {
        if (status === 'OK' && response && response.rows[0]) {
          const elements = response.rows[0].elements;
          const updatedDestinations = destinations.map((dest, index) => {
            const element = elements[index];
            if (element.status === 'OK') {
              return {
                ...dest,
                distance: element.distance?.text || '거리 정보 없음',
                duration: element.duration?.text || '시간 정보 없음'
              };
            }
            return dest;
          });
          resolve(updatedDestinations);
        } else {
          resolve(destinations);
        }
      });
    });
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // 지구의 반지름 (km)
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  generateMapsUrl(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): string {
    return `https://www.google.com/maps/dir/${origin.lat},${origin.lng}/${destination.lat},${destination.lng}/`;
  }
}

export const googleMapsService = new GoogleMapsService();