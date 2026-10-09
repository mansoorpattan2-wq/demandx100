export interface AIPromptResponse {
  question: string;
  answer: string;
  category: string;
}

export const AI_SUGGESTIONS = [
  "Why is Sona Masoori rice demand increasing?",
  "What should I stock next week?",
  "Best time to buy?",
  "Show market opportunities",
  "Compare products"
];

export const AI_KNOWLEDGE_BASE: Record<string, string> = {
  "why is sona masoori rice demand increasing?": 
    "Sona Masoori rice demand is currently surging by +24% across AP & South India due to seasonal festival consumption spikes, steady kirana replenishment, and increased procurement by regional supermarket distributors in Guntur & Vijayawada.",
    
  "what should i stock next week?": 
    "Based on real-time market trends, we recommend stocking up on Sona Masoori Rice (+24% demand surge) and Red Chilli (+28% projected spike). Keep Chana Dal and Moong Dal inventory steady as wholesale mandi arrivals are normal.",
    
  "best time to buy?": 
    "For Sona Masoori Rice: Mill wholesale rates are stable now before the festival season; procure in bulk 5kg bags. For Guntur Red Chilli: Current prices are stable, but projected to rise by 20% next month. Lock in supplier contracts now!",
    
  "show market opportunities": 
    "Key Opportunities Identified:\n1. South India Spice & Chilli Shortage (+26% price premium opportunity)\n2. High Retail Velocity for Packaged Staples in Urban AP\n3. Export Demand Spike for Guntur Pulses & Spices",
    
  "compare products": 
    "Comparing Sona Masoori Rice vs Red Chilli:\n• Sona Masoori Rice: High volume pantry staple, 24% growth, steady kirana daily consumption.\n• Red Chilli: High margin, 28% growth, longer shelf-life (optimal for inventory buildup and supplier contracts).",

  "default":
    "Based on DemandX market intelligence for India: Market activity shows steady +18% growth across agricultural commodities. Inventory optimization can reduce spoilage waste by up to 30% while increasing overall gross margins by 18-22%."
};
