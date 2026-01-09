import { NextRequest, NextResponse } from 'next/server';
import { POI, Location } from '@/types';

/** 高德 POI 搜索 API */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lng = searchParams.get('lng');
  const lat = searchParams.get('lat');
  const radius = searchParams.get('radius') || '1000';
  const types = searchParams.get('types') || '050000|060000'; // 默认餐饮和购物

  if (!lng || !lat) {
    return NextResponse.json(
      { error: '缺少必要参数: lng, lat' },
      { status: 400 }
    );
  }

  const apiKey = process.env.AMAP_WEB_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: '未配置高德地图 API Key' },
      { status: 500 }
    );
  }

  try {
    const url = new URL('https://restapi.amap.com/v5/place/around');
    url.searchParams.append('key', apiKey);
    url.searchParams.append('location', `${lng},${lat}`);
    url.searchParams.append('radius', radius);
    url.searchParams.append('types', types);
    url.searchParams.append('page_size', '25');
    // 获取扩展字段：business 包含评分、人均消费、营业时间、特色标签等
    url.searchParams.append('show_fields', 'business,photos');

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== '1') {
      console.error('高德 API 错误:', data);
      return NextResponse.json(
        { error: data.info || 'POI 搜索失败' },
        { status: 500 }
      );
    }

    // 转换数据格式，过滤无效坐标
    const pois: POI[] = (data.pois || [])
      .map((poi: {
        id: string;
        name: string;
        type: string;
        typecode: string;
        location: string;
        distance?: string;
        address?: string;
        business?: {
          rating?: string;
          cost?: string;
          opentime_today?: string;
          keytag?: string;
        };
      }) => {
        // 验证坐标格式
        if (!poi.location || typeof poi.location !== 'string') {
          return null;
        }
        const [poiLng, poiLat] = poi.location.split(',').map(Number);
        if (isNaN(poiLng) || isNaN(poiLat)) {
          console.warn('POI 坐标无效:', poi.name, poi.location);
          return null;
        }
        
        const location: Location = {
          coordinate: { lng: poiLng, lat: poiLat },
          address: poi.address || '',
          name: poi.name,
        };

        // 解析扩展字段
        const business = poi.business || {};
        const rating = business.rating ? parseFloat(business.rating) : undefined;
        const cost = business.cost ? parseInt(business.cost) : undefined;
        // 解析标签：keytag 格式可能是 "川菜;火锅;特色菜" 或 "川菜"
        const tags = business.keytag 
          ? business.keytag.split(';').filter(Boolean) 
          : [];
        // 也从 type 字段提取标签信息
        if (poi.type) {
          tags.push(...poi.type.split(';').filter(Boolean));
        }

        return {
          id: poi.id,
          name: poi.name,
          type: poi.typecode,
          typeName: poi.type,
          location,
          distance: poi.distance ? parseInt(poi.distance) : undefined,
          rating,
          cost,
          openTime: business.opentime_today,
          tags: [...new Set(tags)], // 去重
        };
      })
      .filter((poi): poi is POI => poi !== null);

    return NextResponse.json({ pois });
  } catch (error) {
    console.error('POI 搜索错误:', error);
    return NextResponse.json(
      { error: 'POI 搜索失败' },
      { status: 500 }
    );
  }
}

