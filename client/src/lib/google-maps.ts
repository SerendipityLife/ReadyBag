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
  private directionsService: google.maps.DirectionsService | null = null;

  constructor() {
    this.loader = null as any;
  }

  private async getApiKey(): Promise<string> {
    if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      return import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    }

    try {
      const response = await fetch('/api/config/google-maps');
      if (response.ok) {
        const data = await response.json();
        return data.apiKey || '';
      }
    } catch (error) {
      console.error('API 키 로드 실패:', error);
    }

    return '';
  }

  async initialize(): Promise<void> {
    if (!this.loader) {
      const apiKey = await this.getApiKey();
      this.loader = new Loader({
        apiKey,
        version: 'weekly',
        libraries: ['places']
      });
    }
    await this.loader.load();

    const mapDiv = document.createElement('div');
    mapDiv.style.display = 'none';
    document.body.appendChild(mapDiv);

    this.map = new google.maps.Map(mapDiv, {
      center: { lat: 35.6762, lng: 139.6503 },
      zoom: 15
    });

    this.service = new google.maps.places.PlacesService(this.map);
    this.distanceService = new google.maps.DistanceMatrixService();
    this.directionsService = new google.maps.DirectionsService();
  }

  async findNearbyPlacesWithRadius(
    location: { lat: number; lng: number },
    type: string,
    keyword: string,
    radius: number
  ): Promise<PlaceResult[]> {
    if (!this.service) await this.initialize();

    return new Promise((resolve) => {
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(location.lat, location.lng),
        radius,
        keyword,
        type: type as any
      };

      this.service!.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
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
            .slice(0, 5)
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

  async calculateDistances(
    origin: { lat: number; lng: number },
    destinations: PlaceResult[],
    travelMode: "walking" | "transit" | "driving" = "walking"
  ): Promise<PlaceResult[]> {
    if (!this.distanceService || destinations.length === 0) {
      return destinations;
    }

    const googleTravelMode = travelMode === 'walking' 
      ? google.maps.TravelMode.WALKING
      : travelMode === 'driving'
      ? google.maps.TravelMode.DRIVING  
      : google.maps.TravelMode.TRANSIT;

    console.log('Google Maps API 이동수단:', travelMode, '→', googleTravelMode);

    return new Promise((resolve) => {
      const destinationLatLngs = destinations.map(dest =>
        new google.maps.LatLng(dest.lat, dest.lng)
      );

      // 대중교통일 때 추가 옵션 설정
      const requestOptions: google.maps.DistanceMatrixRequest = {
        origins: [new google.maps.LatLng(origin.lat, origin.lng)],
        destinations: destinationLatLngs,
        travelMode: googleTravelMode,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      };

      // 대중교통 모드일 때 추가 설정
      if (travelMode === 'transit') {
        requestOptions.transitOptions = {
          modes: [google.maps.TransitMode.BUS, google.maps.TransitMode.SUBWAY, google.maps.TransitMode.TRAIN],
          routingPreference: google.maps.TransitRoutePreference.FEWER_TRANSFERS,
          departureTime: new Date() // 현재 시간 기준
        };
      }

      console.log('Distance Matrix 요청 옵션:', requestOptions);

      this.distanceService!.getDistanceMatrix(requestOptions, async (response, status) => {
        console.log('Distance Matrix 응답:', { status, response });
        
        if (status === 'OK' && response?.rows[0]) {
          const elements = response.rows[0].elements;
          let updated = destinations.map((dest, i) => {
            const el = elements[i];
            console.log(`${dest.name} 결과:`, {
              status: el?.status,
              distance: el?.distance?.text,
              duration: el?.duration?.text,
              travelMode: travelMode
            });
            
            return {
              ...dest,
              distance: el?.distance?.text || '정보 없음',
              duration: el?.duration?.text || '정보 없음'
            };
          });

          // 결과 검증 및 개선된 로깅
          if (travelMode === 'transit') {
            updated.forEach(dest => {
              const durationText = dest.duration;
              const minutes = parseInt(durationText.replace(/[^0-9]/g, ''));
              console.log(`${dest.name} 대중교통 시간 분석:`, {
                originalText: durationText,
                extractedMinutes: minutes,
                isValid: !isNaN(minutes) && minutes <= 60
              });
            });
          }

          resolve(updated);
        } else {
          console.log('Distance Matrix API 실패:', status);
          
          // 대중교통 모드에서 실패시 추가 로깅
          if (travelMode === 'transit') {
            console.log('대중교통 Distance Matrix API 실패, 기본값 반환');
          }
          
          const fallback = destinations.map(dest => ({
            ...dest,
            distance: '정보 없음',
            duration: '정보 없음'
          }));
          resolve(fallback);
        }
      });
    });
  }



  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat/2) ** 2 +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLng/2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  async geocodeAddress(address: string): Promise<HotelLocation | null> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        console.error('Google Maps API 키가 없습니다.');
        return null;
      }

      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`
      );

      if (!response.ok) {
        console.error('Geocoding API 요청 실패:', response.status);
        return null;
      }

      const data = await response.json();

      if (data.status !== 'OK' || !data.results?.length) {
        console.error('Geocoding 결과 없음:', data.status, data.error_message);
        return null;
      }

      const result = data.results[0];
      const location = result.geometry.location;

      return {
        name: result.formatted_address,
        address: address,
        lat: location.lat,
        lng: location.lng
      };
    } catch (error) {
      console.error('Geocoding 오류:', error);
      return null;
    }
  }

  navigateFromAccommodation(
    address: string,
    destination: { lat: number; lng: number; name: string },
    travelMode: 'walking' | 'driving' | 'transit' = 'walking'
  ): void {
    const origin = encodeURIComponent(address.trim());
    const dest = `${destination.lat},${destination.lng}`;
    
    // Google Maps URL의 travelmode 파라미터 매핑
    let urlTravelMode = travelMode;
    if (travelMode === 'transit') {
      urlTravelMode = 'transit';  // 대중교통
    } else if (travelMode === 'walking') {
      urlTravelMode = 'walking';  // 도보
    } else if (travelMode === 'driving') {
      urlTravelMode = 'driving';  // 자동차
    }
    
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=${urlTravelMode}`;

    console.log('길찾기: 출발지 -', address);
    console.log('길찾기: 목적지 -', destination.name);
    console.log('길찾기: 이동수단 -', travelMode, '→', urlTravelMode);

    window.open(url, '_blank');
  }
}

export const googleMapsService = new GoogleMapsService();