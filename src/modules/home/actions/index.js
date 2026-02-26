"use server";
import { Inngest } from "inngest";

export const onInvoke = async() =>{
    await inngest.send({
        name: "agent/hello",
    })
}