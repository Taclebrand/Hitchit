import OpenAI from 'openai';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface VehicleVerificationResult {
  isValid: boolean;
  confidence: number;
  vehicleType: string;
  licensePlate?: string;
  color: string;
  make?: string;
  model?: string;
  year?: number;
  issues: string[];
  recommendations: string[];
}

export class ComputerVisionService {
  static async verifyVehicle(imageBase64: string, expectedVehicleInfo?: {
    licensePlate?: string;
    make?: string;
    model?: string;
    color?: string;
  }): Promise<VehicleVerificationResult> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a vehicle verification expert. Analyze the vehicle image and provide detailed information in JSON format. Check for:
            1. Vehicle type (car, truck, motorcycle, van, etc.)
            2. License plate number (if visible)
            3. Vehicle color
            4. Make and model (if identifiable)
            5. Year (approximate if identifiable)
            6. Any visible damage or issues
            7. Safety and regulatory compliance
            
            Return JSON with: {
              "isValid": boolean,
              "confidence": number (0-1),
              "vehicleType": string,
              "licensePlate": string or null,
              "color": string,
              "make": string or null,
              "model": string or null,
              "year": number or null,
              "issues": [string array of any problems],
              "recommendations": [string array of suggestions]
            }`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: expectedVehicleInfo ? 
                  `Please verify this vehicle. Expected details: ${JSON.stringify(expectedVehicleInfo)}` :
                  "Please analyze this vehicle image and provide verification details."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate expected vehicle info if provided
      if (expectedVehicleInfo) {
        const matches = {
          licensePlate: !expectedVehicleInfo.licensePlate || 
            result.licensePlate?.toLowerCase().includes(expectedVehicleInfo.licensePlate.toLowerCase()),
          make: !expectedVehicleInfo.make || 
            result.make?.toLowerCase().includes(expectedVehicleInfo.make.toLowerCase()),
          model: !expectedVehicleInfo.model || 
            result.model?.toLowerCase().includes(expectedVehicleInfo.model.toLowerCase()),
          color: !expectedVehicleInfo.color || 
            result.color?.toLowerCase().includes(expectedVehicleInfo.color.toLowerCase())
        };

        const matchCount = Object.values(matches).filter(Boolean).length;
        const totalChecks = Object.values(matches).length;
        
        if (matchCount < totalChecks * 0.7) {
          result.isValid = false;
          result.confidence = Math.min(result.confidence, 0.3);
          result.issues.push("Vehicle details don't match registration information");
        }
      }

      return {
        isValid: result.isValid || false,
        confidence: Math.max(0, Math.min(1, result.confidence || 0)),
        vehicleType: result.vehicleType || "unknown",
        licensePlate: result.licensePlate || undefined,
        color: result.color || "unknown",
        make: result.make || undefined,
        model: result.model || undefined,
        year: result.year || undefined,
        issues: result.issues || [],
        recommendations: result.recommendations || []
      };

    } catch (error) {
      console.error('Vehicle verification failed:', error);
      return {
        isValid: false,
        confidence: 0,
        vehicleType: "unknown",
        color: "unknown",
        issues: ["Failed to analyze image"],
        recommendations: ["Please try uploading a clearer image"]
      };
    }
  }

  static async analyzeVehicleForSafety(imageBase64: string): Promise<{
    safetyScore: number;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Analyze this vehicle image for safety concerns. Look for:
            - Visible damage (dents, scratches, broken parts)
            - Tire condition
            - Lighting functionality
            - Cleanliness and maintenance
            - Any safety hazards
            
            Return JSON with: {
              "safetyScore": number (0-100),
              "issues": [string array],
              "recommendations": [string array]
            }`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        safetyScore: Math.max(0, Math.min(100, result.safetyScore || 0)),
        issues: result.issues || [],
        recommendations: result.recommendations || []
      };

    } catch (error) {
      console.error('Safety analysis failed:', error);
      return {
        safetyScore: 0,
        issues: ["Failed to analyze vehicle safety"],
        recommendations: ["Please upload a clear image of the vehicle"]
      };
    }
  }
}