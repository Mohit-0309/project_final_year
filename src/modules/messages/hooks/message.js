import { useQuery, useMutation, useQueryClient, QueryClient } from "@tanstack/react-query";
import { createMessage, getMessages } from "../actions";

export const prefetchMessage = async(QueryClient, projectId) => {
    await QueryClient.prefetchQuery({
        queryKey: ["messages", projectId],
        queryFn: () => getMessages(projectId),
        StaleTime: 10000,
    })
}

export const useGetMessages = (projectId) => {
    return useQuery({
        queryKey: ["messages", projectId],
        queryFn: () => getMessages(projectId),
        staleTime: 10000,
        refetchInterval: (data) =>{
            return data?.length ? 5000 : false;
        }
    })
}

export const useCreateMessages = (projectId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (value) => createMessage(value, projectId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["messages", projectId],
            })
        }
    })
}
