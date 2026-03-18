import { AgentResult ,TextMessage} from "@inngest/agent-kit";

// export function lastAssistantTextMessageContent(result){
//     const lastAssistantTextMessageIndex = result.output.findLastIndex(
//         (message) => message.role === "assistant"
//     )

//     const message = result.output[lastAssistantTextMessageIndex] 


//     return message?.content ? typeof message.content === "string" ? message.content : message.content.map((c)=>c.text).join("") : undefined
// }


export function lastAssistantTextMessageContent(result) {
    try {
      if (!result || !result.output || !Array.isArray(result.output)) {
        return undefined;
      }
  
      const lastAssistantMessage = [...result.output]
        .reverse()
        .find((message) => message?.role === "assistant");
  
      if (!lastAssistantMessage) return undefined;
  
      const content = lastAssistantMessage.content;
  
      if (!content) return undefined;
  
      // Case 1: plain string
      if (typeof content === "string") {
        return content;
      }
  
      // Case 2: array of content blocks
      if (Array.isArray(content)) {
        return content
          .map((c) => c?.text || "")
          .join("");
      }
  
      return undefined;
    } catch (err) {
      console.log("Error in lastAssistantTextMessageContent:", err);
      return undefined;
    }
  }