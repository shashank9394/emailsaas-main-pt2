import React from 'react'
import { Mail } from './mail'
import { ModeToggle } from '@/components/theme-toggle'
import { UserButton } from '@clerk/nextjs'
import ComposeButton from './compose-button'



const MailDashboard = () => {

  return (
    <>
      <div className='absolute bottom-4 left-4'>
        <div className="flex items-center gap-2 justify-center">
          <UserButton />
          <ModeToggle />
          <ComposeButton />
        </div>

      </div>
      <Mail
        defaultLayout={[20, 32, 48]}
        defaultCollapsed={false}
        navCollapsedSize={4}
      />
    </>
  )
}

export default MailDashboard
