// import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "@/prompt";
// import { inngest } from "./client";
// import { gemini, createAgent, createTool, createNetwork, createState } from "@inngest/agent-kit";
// import Sandbox from "e2b";
// import z from "zod";
// import { lastAssistantTextMessageContent } from "./utils";
// import { db } from "@/lib/db";
// import { MessageRole, MessageType } from "@prisma/client";

// export const codeAgentFunction = inngest.createFunction(
//   { id: "code-agent",
//     retries: 2,
//   },
//   { event: "code-agent/run" },
//   async ({ event, step }) => {
    
//     //step - 1 
//     const sandboxId = await step.run("get-sandbox-id", async() => {
//       const sandbox = await Sandbox.create("asurkalika/sanctumui-nextjs-build-abc");
//       return sandbox.sandboxId;
//     })

//     const state = createState(
//       {
//         summary: "",
//         files: {},
//       },
//       {
//         messages: "",
//       }
//     );


//     const codeAgent = createAgent({
//         name: "code-agent",
//         description: "An expert coding agent",
//         system: PROMPT,
//         model: gemini({model: "gemini-2.5-flash"}),
//         tools: [
//           //1. Terminal
//           createTool({
//             name: "terminal",
//             description: "Use the terminal to run commands",
//             parameters: z.object({
//               command: z.string()
//             }),
//             handler: async ({command}, {step}) => {
//               return await step?.run("terminal", async() => {
//                 const buffers = {stdout: "", stderr: ""};

//                 try {
//                   const sandbox = await Sandbox.connect(sandboxId);

//                   const result = await sandbox.commands.run(command, {
//                     onStdout: (data) => {
//                       buffers.stdout += data;

//                     },
//                     onStderr: (data) => {
//                       buffers.stderr += data;

//                     },
//                   })

//                   return result.stdout;
//                 } catch (error) {
                  
//                   console.log(`Command failed: ${error} \n Stdout: ${buffers.stdout}  \n Stderr: ${buffers.stderr}`);

//                   return `Command failed: ${error} \n Stdout: ${buffers.stdout}  \n Stderr: ${buffers.stderr}`;
//                 }
//               })
//             }
//           }),

//           //2. create or update files
//           createTool({
//             name: "createOrUpdateFiles",
//             description: "Create or update files in the sandbox.",
//             parameters: z.object({
//               files: z.array(
//                 z.object({
//                   path: z.string(),
//                   content: z.string(),
//                 })
//               )
//             }),
//             handler: async ({files}, {step, network}) => {
//               const newFiles = await step?.run(
//                 "createOrUpdateFiles",
//                 async () => {
//                   try {
//                     const updatedFiles = network?.state?.data.files || {};

//                     const sandbox = await Sandbox.connect(sandboxId);
//                     for(const file of files)
//                     {
//                       await sandbox.files.write(file.path, file.content);
//                       updatedFiles[file.path] = file.content;
//                     }

//                     return updatedFiles;
//                   } catch (error) {
//                     return "Error: " + error;
//                   }
//                 }
//               );
//               if(typeof newFiles === "object")
//               {
//                 network.state.data.files = newFiles;
//               }
//               return "files updated";
//             }
//           }),

//           //3. read files
//           createTool({
//             name: "readFiles",
//             description: "Read files in the sandbox.",
//             parameters: z.object({
//               files: z.array(z.string())
//             }),
//             handler: async({files}, {step}) => {
//               return await step?.run("readFiles", async() => {
//                 try {
//                   const sandbox = await Sandbox.connect(sandboxId);
//                   const contents = [];
//                   for(const file of files)
//                   {
//                     const content = await sandbox.files.read(file);
//                     contents.push({path: file, content});
//                   }
//                   return JSON.stringify(contents);
//                 } catch (error) {
//                   return "Error: " + error;
//                 }
//               })
//             }
//           }),
//         ],

//         lifecycle: {
//           onResponse: async ({result, network}) => {
//             const lastAssistantMessageText = lastAssistantTextMessageContent(result);

//             if(lastAssistantMessageText && network){
//                 network.state.data.summary = lastAssistantMessageText.trim();
//             }
//             return result;
//           }

//         }
//     });

//     const network = createNetwork({
//       name: "coding-agent-network",
//       agents: [codeAgent],
//       maxIter: 2,

//       router: async ({network}) => {
//         const summary = network.state.data.summary;

//         if(summary){
//           return;
//         }
//         return codeAgent;
//       }
//     })

//     const result = await network.run(event.data.value);

//     const fragmentTitleGenerator = createAgent({
//       name: "fragment-title-generator",
//       description: "Generate a title for the code fragment",
//       system: FRAGMENT_TITLE_PROMPT,
//       model: gemini({model: "gemini-2.5-flash"}),
//     })


//     const responseGeneator = createAgent({
//       name: "response-generator",
//       description: "Generate a response for the fragment",
//       system: RESPONSE_PROMPT,
//       model: gemini({model: "gemini-2.5-flash"}),

//     })


//     const rawSummary = result?.state?.data?.summary || "";

//     const cleanSummary = rawSummary
//       .replace(/<[^>]*>/g, "") // safety (in case model still outputs tags)
//       .trim();

//       if (!cleanSummary) {
//         console.warn("⚠️ Summary missing, using fallback");
      
//         result.state.data.summary =
//           "Built a Next.js application based on the user request.";
      
//       }

//     const { output: fragmentTitleOutput } =
//       await fragmentTitleGenerator.run(cleanSummary);

//     const { output: responseOutput } =
//       await responseGeneator.run(cleanSummary);



//     // const {output: fragmentTitleOutput} = await fragmentTitleGenerator.run(result.state.data.summary);
//     // const {output: responseOutput} = await responseGeneator.run(result.state.data.summary);

//     const generateFragmentTitle = () => {
//       // if(fragmentTitleOutput[0].type !== "text"){
//       //   return "untitled";
//       // }

//       if (!fragmentTitleOutput || fragmentTitleOutput.length === 0) {
//         return "untitled";
//       }

//       if(Array.isArray(fragmentTitleOutput[0].content)){
//         return fragmentTitleOutput[0].content.map((item) => item).join("");
//       }
//       else{
//         return fragmentTitleOutput[0].content;
//       }
//     }

//     const generateResponse = () =>{
//       // if(responseOutput[0].type !== "text"){
//       //   return "Here you go";
//       // }

//       if (!responseOutput || responseOutput.length === 0) {
//         return "Here you go";
//       }

//       if(Array.isArray(responseOutput[0].content)){
//         return responseOutput[0].content.map((item) => item).join("");
//       }
//       else{
//         return responseOutput[0].content;
//       }
//     }

//     // const isError = !result.state.data.summary || Object.keys(result.state.data.files || {}).length === 0;
//     const hasFiles = Object.keys(result.state.data.files || {}).length > 0;
//     const isError = !hasFiles;

//     const sandboxUrl = await step.run("get-sandbox-url", async() => {
//       const sandbox = await Sandbox.connect(sandboxId);
//       const host = sandbox.getHost(3000);
//       return `http://${host}`;
//     })

//     await step.run("save-result", async() => {
//       if(isError){
//         return await db.message.create({
//           data:{
//             projectId: event.data.projectId,
//             content: "Something went wrong. PLease try again",
//             role: MessageRole.ASSISTANT,
//             type: MessageType.ERROR,
//           }
//         })
//       }

//       return await db.message.create({
//         data:{
//           projectId: event.data.projectId,
//           content: generateResponse(),
//           role: MessageRole.ASSISTANT,
//           type: MessageType.RESULT,
//           fragments: {
//             create: {
//               sandboxUrl: sandboxUrl,
//               title: generateFragmentTitle(),
//               files: result.state.data.files,
//             }
//           }
//         }
//       })
//     })

//     return {
//       url: sandboxUrl,
//       title: "untitled",
//       files: result.state.data.files,
//       summary: result.state.data.summary,
//     };
//   },
// );




import Sandbox from "e2b";
import { inngest } from "./client";
import {
  Agent,
  gemini,
  createAgent,
  createTool,
  createNetwork,
  createState,
} from "@inngest/agent-kit";
import z, { json } from "zod";
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "../prompt";
import { lastAssistantTextMessageContent } from "./utils";
import {db} from "../lib/db";
import { MessageRole, MessageType } from "@prisma/client";

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },

  { event: "code-agent/run" },

  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("v0-clone-nextjs-build");
      return sandbox.sandboxId;
    });

    const previousMessages = await step.run(
      "get-previous-messages",
      async () => {
        const formattedMessages = [];

        const messages = await db.message.findMany({
          where: {
            projectId: event.data.projectId,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        for (const message of messages) {
          formattedMessages.push({
            type: "text",
            role: message.role === "ASSISTANT" ? "assistant" : "user",
            content: message.content,
          });
        }

        return formattedMessages;
      }
    );

    const state = createState(
      {
        summary: "",
        files: {},
      },
      {
        messages: previousMessages,
      }
    );

    const codeAgent = createAgent({
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT,
      model: gemini({ model: "gemini-2.5-flash" }),
      tools: [
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };

              try {
                const sandbox = await Sandbox.connect(sandboxId);
                const result = await sandbox.commands.run(command, {
                  onStdout: (data) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data) => {
                    buffers.stderr += data;
                  },
                });

                return result.stdout;
              } catch (error) {
                console.log(
                  `Command failed: ${error} \n stdout: ${buffers.stdout}\n stderr: ${buffers.stderr}`
                );

                return `Command failed: ${error} \n stdout: ${buffers.stdout}\n stderr: ${buffers.stderr}`;
              }
            });
          },
        }),

        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              })
            ),
          }),
          handler: async ({ files }, { step, network }) => {
            const newFiles = await step?.run(
              "createOrUpdateFiles",
              async () => {
                try {
                  const updatedFiles = network?.state?.data.files || {};
                  const sandbox = await Sandbox.connect(sandboxId);
                  for (const file of files) {
                    await sandbox.files.write(file.path, file.content);
                    updatedFiles[file.path] = file.content;
                  }
                  return updatedFiles;
                } catch (error) {
                  return "Error" + error;
                }
              }
            );

            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
            }
          },
        }),

        createTool({
          name: "readFiles",
          description: "Read files in the sandbox",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await Sandbox.connect(sandboxId);
                const contents = [];

                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }

                return JSON.stringify(contents);
              } catch (error) {
                return "Error" + error;
              }
            });
          },
        }),
      ],

      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText =
            lastAssistantTextMessageContent(result);

          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }

          return result;
        },
      },
    });

    const network = createNetwork({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 2,
      defaultState: state,
      router: async ({ network }) => {
        const summary = network.state.data.summary;

        if (summary) {
          return;
        }
        return codeAgent;
      },
    });

    const result = await network.run(event.data.value, { state });

    const fragmentTitleGenerator = createAgent({
      name: "fragment-title-generator",
      description: "Generate a title for the fragment",
      system: FRAGMENT_TITLE_PROMPT,
      model: gemini({ model: "gemini-2.5-flash" }),
    });

    const responseGenerator = createAgent({
      name: "response-generator",
      description: "Generate a response for the fragment",
      system: RESPONSE_PROMPT,
      model: gemini({ model: "gemini-2.5-flash" }),
    });

    const { output: fragmentTitleOutput } = await fragmentTitleGenerator.run(
      result.state.data.summary
    );
    const { output: responseOutput } = await responseGenerator.run(
      result.state.data.summary
    );

    const generateFragmentTitle = () => {
      if (fragmentTitleOutput[0].type !== "text") {
        return "Fragment";
      }

      if (Array.isArray(fragmentTitleOutput[0].content)) {
        return fragmentTitleOutput[0].content.map((c) => c).join("");
      } else {
        return fragmentTitleOutput[0].content;
      }
    };

    const generateResponse = () => {
      if (responseOutput[0].type !== "text") {
        return "Here you go";
      }

      if (Array.isArray(responseOutput[0].content)) {
        return responseOutput[0].content.map((c) => c).join("");
      } else {
        return responseOutput[0].content;
      }
    };

    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await Sandbox.connect(sandboxId);
      const host = sandbox.getHost(3000);

      return `http://${host}`;
    });

    await step.run("save-result", async () => {
      if (isError) {
        return await db.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong. Please try again.",
            role: MessageRole.ASSISTANT,
            type: MessageType.ERROR,
          },
        });
      }

      return await db.message.create({
        data: {
          projectId: event.data.projectId,
          content: generateResponse(),
          role: MessageRole.ASSISTANT,
          type: MessageType.RESULT,
          fragments: {
            create: {
              sandboxUrl: sandboxUrl,
              title: generateFragmentTitle(),
              files: result.state.data.files,
            },
          },
        },
      });
    });

    return {
      url: sandboxUrl,
      title:
        fragmentTitleOutput[0].type === "text"
          ? fragmentTitleOutput[0].content
          : "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  }
);