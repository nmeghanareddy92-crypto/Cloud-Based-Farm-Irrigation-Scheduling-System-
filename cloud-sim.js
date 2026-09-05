/* ==========================================================================
   Cloud-Based Farm Irrigation Scheduling System - Cloud & IoT Telemetry Simulator
   Simulates AWS IoT Core / Azure IoT Hub MQTT Telemetry & Serverless Processing
   ========================================================================== */

class CloudTelemetrySimulator {
  constructor() {
    this.telemetryData = {
      moisture: 38,
      temperature: 28.5,
      humidity: 62,
      solarRadiation: 780, // W/m2
      rainProbability: 15, // %
      flowRate: 0.0, // L/min
      activeValves: 1,
      totalValves: 4
    };

    this.cloudMetrics = {
      messagesProcessed: 142890,
      lambdaInvocations: 48920,
      dynamoDbWrites: 142890,
      s3StorageMB: 482.4,
      avgLatencyMs: 24,
      estimatedMonthlyCost: 4.85 // USD
    };

    this.zones = [
      { id: 'zone-1', name: 'North Sector (Rice)', crop: 'Rice', moisture: 42, threshold: 40, status: 'Idle', valve: 'OFF', lastIrrigated: 'Today, 06:00 AM' },
      { id: 'zone-2', name: 'South Sector (Wheat)', crop: 'Wheat', moisture: 28, threshold: 35, status: 'Needs Water', valve: 'ON', lastIrrigated: 'Yesterday, 05:30 PM' },
      { id: 'zone-3', name: 'East Orchard (Citrus)', crop: 'Vegetables', moisture: 54, threshold: 45, status: 'Optimal', valve: 'OFF', lastIrrigated: '2 Days ago' },
      { id: 'zone-4', name: 'Polyhouse A (Microgreens)', crop: 'Maize', moisture: 62, threshold: 50, status: 'Optimal', valve: 'OFF', lastIrrigated: 'Today, 08:15 AM' }
    ];

    this.listeners = [];
    this.intervalId = null;
  }

  start() {
    if (this.intervalId) return;
    
    // Simulate real-time sensor fluctuation every 3 seconds
    this.intervalId = setInterval(() => {
      this.updateSimulation();
    }, 3000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  updateSimulation() {
    // Fluctuate soil moisture slightly based on active valves
    this.zones.forEach(zone => {
      if (zone.valve === 'ON') {
        zone.moisture = Math.min(100, zone.moisture + Math.floor(Math.random() * 2 + 1));
        if (zone.moisture >= 75) {
          zone.valve = 'OFF';
          zone.status = 'Optimal';
          zone.lastIrrigated = 'Just now (Auto-Closed)';
        }
      } else {
        // Natural moisture evaporation
        if (Math.random() > 0.4) {
          zone.moisture = Math.max(10, zone.moisture - (Math.random() * 0.4));
        }
        if (zone.moisture < zone.threshold) {
          zone.status = 'Needs Water';
        } else {
          zone.status = 'Optimal';
        }
      }
      zone.moisture = Math.round(zone.moisture * 10) / 10;
    });

    // Update global telemetry averages
    const totalMoisture = this.zones.reduce((sum, z) => sum + z.moisture, 0);
    this.telemetryData.moisture = Math.round((totalMoisture / this.zones.length) * 10) / 10;
    this.telemetryData.temperature = Math.round((28 + (Math.random() * 1.5 - 0.75)) * 10) / 10;
    this.telemetryData.humidity = Math.round((60 + (Math.random() * 4 - 2)) * 10) / 10;

    // Update cloud metric counters
    this.cloudMetrics.messagesProcessed += 4;
    this.cloudMetrics.lambdaInvocations += 2;
    this.cloudMetrics.dynamoDbWrites += 4;
    this.cloudMetrics.s3StorageMB = Math.round((this.cloudMetrics.s3StorageMB + 0.002) * 1000) / 1000;
    this.cloudMetrics.avgLatencyMs = Math.floor(18 + Math.random() * 12);

    this.notifyListeners();
  }

  toggleZoneValve(zoneId) {
    const zone = this.zones.find(z => z.id === zoneId);
    if (zone) {
      zone.valve = zone.valve === 'ON' ? 'OFF' : 'ON';
      if (zone.valve === 'ON') {
        zone.status = 'Irrigating...';
        zone.lastIrrigated = 'Started Just Now';
      } else {
        zone.status = zone.moisture < zone.threshold ? 'Needs Water' : 'Optimal';
      }
      this.notifyListeners();
      return zone;
    }
    return null;
  }

  generateMqttPayload() {
    return JSON.stringify({
      deviceId: "ESP32-FARM-GATEWAY-01",
      timestamp: new Date().toISOString(),
      payload: {
        sensors: {
          soilMoisturePct: this.telemetryData.moisture,
          ambientTempC: this.telemetryData.temperature,
          humidityPct: this.telemetryData.humidity,
          solarRadWM2: this.telemetryData.solarRadiation,
          rainRateMmHr: 0.0
        },
        cloudSyncState: "SYNCED_OK",
        valves: this.zones.map(z => ({ zoneId: z.id, state: z.valve }))
      }
    }, null, 2);
  }

  generateCostBreakdown() {
    return JSON.stringify({
      cloudProvider: "AWS (US-East-1)",
      monthlyResourceBilling: {
        awsIotCoreMsgIngestion: `$${(this.cloudMetrics.messagesProcessed * 0.000001).toFixed(4)} (1M Msgs = $1.00)`,
        awsLambdaExecutions: `$${(this.cloudMetrics.lambdaInvocations * 0.0000002).toFixed(4)} (128MB Memory)`,
        amazonDynamoDbStorage: `$${(0.25).toFixed(2)} (Standard RCU/WCU)`,
        amazonS3TelemetryArchive: `$${(this.cloudMetrics.s3StorageMB * 0.000023).toFixed(4)} (Standard Storage)`,
        totalEstimatedMonthlyBill: `$${this.cloudMetrics.estimatedMonthlyCost.toFixed(2)} USD`
      },
      efficiencyNote: "Smart ET0 Serverless scheduling reduces water & electricity costs by 38.5% compared to legacy timers."
    }, null, 2);
  }

  generateLambdaCode() {
    return `# AWS Lambda Python 3.11 - Serverless ET0 Irrigation Handler
import json
import boto3
import math

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('IrrigationSchedules')

def lambda_handler(event, context):
    payload = event['payload']['sensors']
    moisture = payload['soilMoisturePct']
    temp = payload['ambientTempC']
    solar_rad = payload['solarRadWM2']
    
    # Penman-Monteith Simplified ET0 calculation (mm/day)
    et0 = 0.0023 * (temp + 17.8) * math.sqrt(abs(temp)) * (solar_rad * 0.082)
    
    should_irrigate = moisture < 35.0
    action = "TRIGGER_VALVE_ON" if should_irrigate else "MAINTAIN_IDLE"
    
    # Persist record to DynamoDB
    table.put_item(Item={
        'FarmId': 'FARM_01',
        'Timestamp': event['timestamp'],
        'MoisturePct': str(moisture),
        'ET0_Calculated': str(round(et0, 2)),
        'Action': action
    })
    
    return {
        'statusCode': 200,
        'body': json.dumps({'ET0': round(et0, 2), 'Action': action})
    }`;
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  notifyListeners() {
    this.listeners.forEach(cb => cb(this.telemetryData, this.zones, this.cloudMetrics));
  }
}

// Global instance
const cloudSim = new CloudTelemetrySimulator();
