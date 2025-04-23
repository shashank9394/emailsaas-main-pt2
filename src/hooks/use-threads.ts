import { api } from '@/trpc/react'
import { getQueryKey } from '@trpc/react-query'
import React from 'react'
import { useLocalStorage } from 'usehooks-ts'
import { atom, useAtom } from "jotai"


const threadIdAtom = atom<string | null>(null)

export function useThread() {
  return useAtom(threadIdAtom)
}


const useThreads = () => {
    const { data: accounts } = api.account.getAccounts.useQuery()
    const [accountId] = useLocalStorage('accountId', '')
    const [tab] = useLocalStorage('normalhuman-tab', 'inbox')
    const [done] = useLocalStorage('normalhuman-done', false)
    const [threadId, setThreadId]  = useAtom(threadIdAtom)
    const queryKey = getQueryKey(api.account.getThreads, { accountId, tab, done }, 'query')
    const { data: threads, isFetching, refetch } = api.account.getThreads.useQuery({
        accountId,
        done,
        tab
    }, { enabled: !!accountId && !!tab, placeholderData: (e) => e, refetchInterval: false })

    return {
        threads,
        isFetching,
        account: accounts?.find((account) => account.id === accountId),
        refetch,
        accounts,
        queryKey,
        threadId, setThreadId,
        accountId
    }
}

export default useThreads