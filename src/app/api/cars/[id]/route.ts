import { NextRequest, NextResponse } from "next/server";
import { OPENFGA_URL, STORE_ID, MODEL_ID } from "@/config/openfga";
import fs from "fs";
import path from "path";

// Helper function to read cars data
const readCarsData = () => {
  const filePath = path.join(process.cwd(), "src/data/cars.json");
  const fileContent = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(fileContent);
};

// Helper function to write cars data
const writeCarsData = (data: any) => {
  const filePath = path.join(process.cwd(), "src/data/cars.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Check user permissions
async function checkPermissions(
  token: string,
  permission: "can_edit" | "can_delete"
) {
  const tokenData = JSON.parse(
    Buffer.from(token.split(".")[1], "base64").toString()
  );
  const username = tokenData.preferred_username;

  const response = await fetch(`${OPENFGA_URL}/stores/${STORE_ID}/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      authorization_model_id: MODEL_ID,
      tuple_key: {
        user: `person:${username}`,
        relation: permission,
        object: "application:default",
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to check permissions");
  }

  const data = await response.json();
  return data.allowed;
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = await context.params;

    // Check authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check edit permission
    const token = authHeader.split(" ")[1];
    const hasEditPermission = await checkPermissions(token, "can_edit");
    if (!hasEditPermission) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Get updated car data from request body
    const updatedCar = await request.json();

    // Read current cars data
    const cars = readCarsData();

    // Find the car to update
    const carIndex = cars.findIndex((car: any) => car.id === id);
    if (carIndex === -1) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    // Update the car
    const newCar = {
      ...cars[carIndex],
      ...updatedCar,
      id, // Keep the original ID
    };
    cars[carIndex] = newCar;

    // Write updated data back to file
    writeCarsData(cars);

    return NextResponse.json({
      success: true,
      message: "Car updated successfully",
      car: newCar,
    });
  } catch (error) {
    console.error("Error updating car:", error);
    return NextResponse.json(
      { error: "Failed to update car" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = await context.params;

    // Check authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check delete permission
    const token = authHeader.split(" ")[1];
    const hasDeletePermission = await checkPermissions(token, "can_delete");
    if (!hasDeletePermission) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Read current cars data
    const cars = readCarsData();

    // Find the car to delete
    const carIndex = cars.findIndex((car: any) => car.id === id);
    if (carIndex === -1) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    // Remove the car
    cars.splice(carIndex, 1);

    // Write updated data back to file
    writeCarsData(cars);

    return NextResponse.json({
      success: true,
      message: "Car deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting car:", error);
    return NextResponse.json(
      { error: "Failed to delete car" },
      { status: 500 }
    );
  }
}
