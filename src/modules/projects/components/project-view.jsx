"use client";
import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ProjectHeader from './project-header';

const ProjectView = ({projectId}) => {
  return (
    <div className='h-screen'>
        <ResizablePanelGroup direction="horizontal">
            <ResizablePanel
            defaultSize={35}
            minSize={20}
            className="flex flex-col min-h-0"
            >
                <ProjectHeader projectId={projectId}/>

                {/* TODO Message Container */}
                

            </ResizablePanel>

            <ResizableHandle withHandle/>
            <ResizablePanel defaultSize={65} minSize={50}>
                {/* todo add tabs code and demo */}
            </ResizablePanel>

        </ResizablePanelGroup>
    </div>
  )
}

export default ProjectView