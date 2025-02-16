import { NextResponse } from 'next/server';
import carsData from '../../../data/cars.json';

export async function GET() {
  try {
    return NextResponse.json(carsData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch cars data' },
      { status: 500 }
    );
  }
}