"use server";
//import { Inngest } from "inngest";
import { inngest } from "@/inngest/client";

export const onInvoke = async() =>{
    await inngest.send({
        name: "agent/hello",
    })
}