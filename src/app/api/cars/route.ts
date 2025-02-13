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

export async function POST(request: Request) {
  try {
    const car = await request.json();
    // In a real application, you would save this to a database
    // For now, we'll just return the car data
    return NextResponse.json(car, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add car' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const car = await request.json();
    // In a real application, you would update this in a database
    // For now, we'll just return the updated car data
    return NextResponse.json(car);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update car' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Car ID is required' },
        { status: 400 }
      );
    }

    // In a real application, you would delete from a database
    // For now, we'll just return a success message
    return NextResponse.json({ message: 'Car deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete car' },
      { status: 500 }
    );
  }
} 