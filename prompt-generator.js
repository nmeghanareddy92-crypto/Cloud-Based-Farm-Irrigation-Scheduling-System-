/* ==========================================================================
   Cloud-Based Farm Irrigation Scheduling System - AI Master Prompt Generator
   Provides copyable optimized prompts for building, documenting, and presenting
   ========================================================================== */

const MasterPrompts = {
  buildProject: `Act as a Senior Cloud Solutions Architect & Full-Stack Developer. Build a comprehensive, production-ready "Cloud-Based Farm Irrigation Scheduling System" web application for a Cloud Computing course project. 

REQUIREMENTS:
1. Frontend Stack: HTML5, CSS3 (Dark Emerald Glassmorphism, Responsive CSS Grid/Flexbox), and Vanilla JavaScript (ES6+).
2. Architecture Simulation:
   - Real-time IoT sensor telemetry feed (Soil Moisture %, Soil Temp, Solar Radiation, Air Humidity).
   - Serverless Cloud engine calculating Evapotranspiration (ET0 Penman-Monteith equation).
   - Cloud Telemetry Simulator showcasing AWS IoT Core MQTT payload JSON streams, AWS Lambda trigger logs, and DynamoDB database records.
3. Features:
   - Hero section with key statistics and live connection status.
   - Farm Sector Grid with individual valve toggles (Drip/Sprinkler) and soil moisture progress indicators.
   - Smart Irrigation Scheduling Form with client-side validation, localStorage persistence, and auto-generated Schedule IDs.
   - Searchable & Filterable Schedule Tracker (by Crop Type, Location, Status).
   - Admin Panel with login authentication to manage, update, and complete irrigation tasks.
   - Farmer Testimonials, About, and Contact sections with submission feedback.
   - Dynamic Canvas visual charts for 24-hour soil moisture curves and water savings metrics.`,

  generateReport: `Act as a Cloud Computing Academic Professor. Create a comprehensive 10-page Technical Project Report for the "Cloud-Based Farm Irrigation Scheduling System".

Include the following sections:
1. ABSTRACT & INTRODUCTION: Problem statement of agricultural water wastage and cloud computing solution.
2. SYSTEM ARCHITECTURE: Detailed breakdown of Edge IoT Sensors (ESP32) -> AWS IoT Core -> AWS Lambda (ET0 Serverless calculation) -> DynamoDB -> S3 Long-term Telemetry Archive -> Single Page Web Dashboard.
3. MATHEMATICAL MODEL: Formulate the Penman-Monteith Evapotranspiration equation (ET0 = [0.408*Delta*(Rn-G) + gamma*(900/(T+273))*u2*(es-ea)] / [Delta + gamma*(1+0.34*u2)]).
4. DATABASE SCHEMA: DynamoDB table definition (Partition Key: FarmId, Sort Key: Timestamp, Attributes: SoilMoisture, ValveState, WeatherCondition).
5. CLOUD SECURITY & COST ANALYSIS: IAM role policies, MQTT TLS v1.3 encryption, and monthly cost calculation ($4.85/month for 100,000 IoT messages).
6. CONCLUSION & FUTURE SCOPE: Machine learning integration for satellite NDVI weather predictive modeling.`,

  vivaPreparation: `Act as an Expert Examiner for a Cloud Computing Viva Exam. Provide a list of 15 high-yield viva questions with detailed model answers for defending the "Cloud-Based Farm Irrigation Scheduling System" project.

Cover key topics:
- Why choose Cloud-Based Irrigation over traditional timer-based microcontrollers?
- How does the system handle network disconnection at the farm (Edge Buffering vs Cloud Sync)?
- What is the advantage of Serverless Lambda execution for irrigation triggers compared to EC2 virtual servers?
- How is security guaranteed between ESP32 field sensors and AWS IoT Core (X.509 Certificates)?
- Explain the role of Evapotranspiration (ET0) in dynamic schedule calculation.`,

  awsIntegration: `Provide a step-by-step technical guide with Node.js and AWS SDK v3 code snippets to connect this HTML/JS frontend to live AWS Cloud services.

Step 1: Set up AWS IoT Core Topic 'farm/telemetry/pub' with MQTT over WebSockets.
Step 2: Write an AWS Lambda Python function triggered by IoT Core to compute ET0 and store records in DynamoDB 'IrrigationSchedules'.
Step 3: Create an AWS API Gateway HTTP API endpoint to allow the web frontend to GET schedules and POST manual valve overrides securely via Cognito JWT tokens.`
};

function copyPromptToClipboard(promptKey) {
  const text = MasterPrompts[promptKey];
  if (text) {
    navigator.clipboard.writeText(text).then(() => {
      showToastNotification('Prompt copied to clipboard successfully!');
    }).catch(err => {
      console.error('Failed to copy prompt: ', err);
    });
  }
}
