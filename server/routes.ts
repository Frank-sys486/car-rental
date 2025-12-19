import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema, insertVehicleSchema } from "@shared/schema";

export async function registerRoutes(server: Server, app: Express) {
  app.get("/api/vehicles", async (req, res) => {
    const start = req.query.start as string | undefined;
    const end = req.query.end as string | undefined;
    const vehicles = await storage.getVehicles(start, end);
    res.json(vehicles);
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    const vehicle = await storage.getVehicle(req.params.id);
    if (!vehicle) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }
    res.json(vehicle);
  });

  app.post("/api/vehicles", async (req, res) => {
    const parsed = insertVehicleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(parsed.error);
      return;
    }
    const vehicle = await storage.createVehicle(parsed.data);
    res.json(vehicle);
  });

  app.patch("/api/vehicles/:id", async (req, res) => {
    const parsed = insertVehicleSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(parsed.error);
      return;
    }
    const vehicle = await storage.updateVehicle(req.params.id, req.body);
    if (!vehicle) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }
    res.json(vehicle);
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    const success = await storage.deleteVehicle(req.params.id);
    if (!success) {
      res.status(404).json({ message: "Vehicle not found" });
      return;
    }
    res.status(204).end();
  });

  app.get("/api/bookings", async (req, res) => {
    const bookings = await storage.getBookings();
    res.json(bookings);
  });

  app.get("/api/bookings/vehicle/:vehicleId", async (req, res) => {
    const bookings = await storage.getBookingsByVehicle(req.params.vehicleId);
    res.json(bookings);
  });

  app.post("/api/bookings", async (req, res) => {
    const parsed = insertBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(parsed.error);
      return;
    }
    const booking = await storage.createBooking(parsed.data);
    res.json(booking);
  });

  app.patch("/api/bookings/:id", async (req, res) => {
    const parsed = insertBookingSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(parsed.error);
      return;
    }
    const booking = await storage.updateBooking(req.params.id, req.body);
    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }
    res.json(booking);
  });

  app.get("/api/stats", async (req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  app.post("/api/customers/update", async (req, res) => {
    const { oldName, newDetails } = req.body;
    if (!oldName || !newDetails) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    await storage.updateCustomer(oldName, newDetails);
    res.json({ success: true });
  });
}