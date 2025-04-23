'use client'
import React from 'react'
import EmailEditor from './email-editor/index'
import { useThread } from '@/hooks/use-threads'
import useThreads from '@/hooks/use-threads'
import { api, type RouterOutputs } from '@/trpc/react'
import { toast } from 'sonner'

const ReplyBox = () => {

    const [threadId] = useThread()
    const { accountId } = useThreads()
    const { data: replyDetails } = api.account.getReplyDetails.useQuery({
        accountId: accountId,
        threadId: threadId || '',
        replyType: 'reply'
    })
    if (!replyDetails) return <></>;
    return <Component replyDetails={replyDetails} />
}

const Component = ({ replyDetails }: { replyDetails: NonNullable<RouterOutputs['account']['getReplyDetails']> }) => {
    const [threadId] = useThread()
    const { accountId } = useThreads()

    const [subject, setSubject] = React.useState(replyDetails.subject.startsWith('Re:') ? replyDetails.subject : `Re: ${replyDetails.subject}`);

    const [toValues, setToValues] = React.useState<{ label: string, value: string }[]>(replyDetails.to.map(to => ({ label: to.address ?? to.name, value: to.address })) || [])
    const [ccValues, setCcValues] = React.useState<{ label: string, value: string }[]>(replyDetails.cc.map(cc => ({ label: cc.address ?? cc.name, value: cc.address })) || [])

    const sendEmail = api.account.sendEmail.useMutation()
    React.useEffect(() => {
        if (!replyDetails || !threadId) return;

        if (!replyDetails.subject.startsWith('Re:')) {
            setSubject(`Re: ${replyDetails.subject}`)
        }
        setToValues(replyDetails.to.map(to => ({ label: to.address ?? to.name, value: to.address })))
        setCcValues(replyDetails.cc.map(cc => ({ label: cc.address ?? cc.name, value: cc.address })))

    }, [replyDetails, threadId])

    const handleSend = async (value: string) => {
        if (!replyDetails) return;
        sendEmail.mutate({
            accountId,
            threadId: threadId ?? undefined,
            body: value,
            subject,
            from: replyDetails.from,
            to: replyDetails.to.map(to => ({ name: to.name ?? to.address, address: to.address })),
            cc: replyDetails.cc.map(cc => ({ name: cc.name ?? cc.address, address: cc.address })),
            replyTo: replyDetails.from,
            inReplyTo: replyDetails.id,
        }, {
            onSuccess: () => {
                toast.success("Email sent")
                // editor?.commands.clearContent()
            },
            onError: (error) => {
                toast.error(error.message)
            }
        })
        console.log(value);
        
    }

    return (
        <EmailEditor
            toValues={toValues}
            ccValues={ccValues}

            onToChange={(values) => {
                setToValues(values)
            }}
            onCcChange={(values) => {
                setCcValues(values)
            }}

            subject={subject}
            setSubject={setSubject}
            to={toValues.map(to => to.value)}
            handleSend={handleSend}
            isSending={sendEmail.isPending}
            // isSending={false}
        />
    )

}

export default ReplyBox