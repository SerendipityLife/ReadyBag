import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getCurrencyRate } from "./services/currency";
import { getInstagramHashtags } from "./services/instagram";

export async function registerRoutes(app: Express): Promise<Server> {
  // API prefix
  const apiPrefix = "/api";

  // Get all countries
  app.get(`${apiPrefix}/countries`, async (req, res) => {
    try {
      const countries = await storage.getCountries();
      return res.json(countries);
    } catch (error) {
      console.error("Error fetching countries:", error);
      return res.status(500).json({ message: "Failed to fetch countries" });
    }
  });

  // Get products by country
  app.get(`${apiPrefix}/products`, async (req, res) => {
    try {
      const countryId = req.query.countryId as string;
      
      if (!countryId) {
        // 기본값으로 일본 상품 반환
        const defaultProducts = await storage.getProductsByCountry("japan");
        return res.json(defaultProducts);
      }
      
      const products = await storage.getProductsByCountry(countryId);
      return res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      return res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get user products (categorized)
  app.get(`${apiPrefix}/user-products`, async (req, res) => {
    try {
      const countryId = req.query.countryId as string;
      const userId = req.session?.userId || null;
      const sessionId = req.session?.id || null;
      
      if (!countryId) {
        return res.status(400).json({ message: "Country ID is required" });
      }
      
      const userProducts = await storage.getUserProducts(countryId, userId, sessionId);
      return res.json(userProducts);
    } catch (error) {
      console.error("Error fetching user products:", error);
      return res.status(500).json({ message: "Failed to fetch user products" });
    }
  });

  // Create or update user product status
  app.post(`${apiPrefix}/user-products`, async (req, res) => {
    try {
      const schema = z.object({
        productId: z.number(),
        status: z.string(),
      });
      
      const validatedData = schema.parse(req.body);
      const userId = req.session?.userId || null;
      const sessionId = req.session?.id || req.sessionID;
      
      const userProduct = await storage.upsertUserProduct(
        validatedData.productId,
        validatedData.status,
        userId,
        sessionId
      );
      
      return res.status(201).json(userProduct);
    } catch (error) {
      console.error("Error updating product status:", error);
      return res.status(500).json({ message: "Failed to update product status" });
    }
  });

  // Update user product status
  app.patch(`${apiPrefix}/user-products/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const schema = z.object({
        status: z.string(),
      });
      
      const validatedData = schema.parse(req.body);
      const userId = null; // 현재는 사용자 인증을 사용하지 않음
      const sessionId = 'anonymous-session'; // 세션 ID 문제 해결을 위한 임시 조치
      
      // Log detailed information for debugging
      console.log("Update request: ID=", id, "Status=", validatedData.status, "UserID=", userId, "SessionID=", sessionId);
      
      const userProduct = await storage.updateUserProductStatus(
        id,
        validatedData.status,
        userId,
        sessionId
      );
      
      if (!userProduct) {
        // Check if user product exists at all
        const checkUserProduct = await storage.getUserProductById(id);
        if (!checkUserProduct) {
          return res.status(404).json({ message: "User product not found" });
        } else {
          return res.status(403).json({ message: "User not authorized to update this product" });
        }
      }
      
      return res.json(userProduct);
    } catch (error) {
      console.error("Error updating user product:", error);
      return res.status(500).json({ message: "Failed to update user product" });
    }
  });
  
  // Delete user product
  app.delete(`${apiPrefix}/user-products/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const userId = null; // 현재는 사용자 인증을 사용하지 않음
      const sessionId = 'anonymous-session'; // 세션 ID 문제 해결을 위한 임시 조치
      
      // Log detailed information for debugging
      console.log("Delete request: ID=", id, "UserID=", userId, "SessionID=", sessionId);
      
      // First check if this user product exists
      const existingProduct = await storage.getUserProductById(id);
      if (!existingProduct) {
        console.log("Product with ID", id, "does not exist");
        return res.status(200).json({ message: "Product already deleted" });
      }
      
      const deletedUserProduct = await storage.deleteUserProduct(
        id,
        userId,
        sessionId
      );
      
      if (!deletedUserProduct) {
        return res.status(403).json({ message: "User not authorized to delete this product" });
      }
      
      console.log("Successfully deleted product:", deletedUserProduct);
      return res.json(deletedUserProduct);
    } catch (error) {
      console.error("Error deleting user product:", error);
      return res.status(500).json({ message: "Failed to delete user product" });
    }
  });

  // Create a shared list
  app.post(`${apiPrefix}/shared-list`, async (req, res) => {
    try {
      const schema = z.object({
        countryId: z.string(),
      });
      
      const validatedData = schema.parse(req.body);
      const status = req.query.status as string | undefined;
      const userId = req.session?.userId || null;
      const sessionId = req.session?.id || req.sessionID;
      
      // Generate a unique share ID
      const shareId = nanoid(8);
      
      // Create shared list in database
      const sharedList = await storage.createSharedList(
        shareId,
        validatedData.countryId,
        status,
        userId,
        sessionId
      );
      
      // Generate share URL
      const host = req.headers.host || "localhost:5000";
      const protocol = req.secure ? "https" : "http";
      const shareUrl = `${protocol}://${host}/shared/${shareId}`;
      
      return res.status(201).json({ shareId, shareUrl });
    } catch (error) {
      console.error("Error creating shared list:", error);
      return res.status(500).json({ message: "Failed to create shared list" });
    }
  });

  // Get a shared list by share ID
  app.get(`${apiPrefix}/shared-list/:shareId`, async (req, res) => {
    try {
      const shareId = req.params.shareId;
      
      const sharedListData = await storage.getSharedListByShareId(shareId);
      
      if (!sharedListData) {
        return res.status(404).json({ message: "Shared list not found or expired" });
      }
      
      return res.json(sharedListData);
    } catch (error) {
      console.error("Error fetching shared list:", error);
      return res.status(500).json({ message: "Failed to fetch shared list" });
    }
  });

  // Get currency exchange rate
  app.get(`${apiPrefix}/currency`, async (req, res) => {
    try {
      const fromCurrency = req.query.from as string || "JPY";
      const toCurrency = req.query.to as string || "KRW";
      
      const rate = await getCurrencyRate(fromCurrency, toCurrency);
      
      return res.json(rate);
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      return res.status(500).json({ message: "Failed to fetch exchange rate" });
    }
  });

  // Get Instagram hashtags for a product
  app.get(`${apiPrefix}/instagram-hashtags`, async (req, res) => {
    try {
      const productName = req.query.productName as string;
      
      if (!productName) {
        return res.status(400).json({ message: "Product name is required" });
      }
      
      const hashtags = await getInstagramHashtags(productName);
      
      return res.json({ hashtags });
    } catch (error) {
      console.error("Error fetching Instagram hashtags:", error);
      return res.status(500).json({ message: "Failed to fetch Instagram hashtags" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
