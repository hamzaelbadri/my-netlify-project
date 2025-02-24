import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';
import { Calendar, Clock, CircleDot as DragHandleDots2 } from 'lucide-react';
import { Post, FacebookPage } from '../types';
import { Button } from './Button';
import { usePostStore } from '../store';

interface DragAndDropSchedulerProps {
  posts: Post[];
  pages: FacebookPage[];
  onPostsReorder: (posts: Post[]) => void;
}

export function DragAndDropScheduler({
  posts,
  pages,
  onPostsReorder,
}: DragAndDropSchedulerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: format(startOfDay(new Date()), 'yyyy-MM-dd'),
    end: format(endOfDay(addDays(new Date(), 7)), 'yyyy-MM-dd'),
  });

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = posts.findIndex((post) => post.id === active.id);
      const newIndex = posts.findIndex((post) => post.id === over.id);

      const newPosts = arrayMove(posts, oldIndex, newIndex);
      onPostsReorder(newPosts);
    }

    setActiveId(null);
  };

  const filteredPosts = posts.filter((post) => {
    const postDate = new Date(post.scheduledFor);
    return (
      postDate >= new Date(dateRange.start) && postDate <= new Date(dateRange.end)
    );
  });

  const activePost = activeId ? posts.find((post) => post.id === activeId) : null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
          Post Schedule
        </h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredPosts.map((post) => post.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {filteredPosts.map((post) => (
              <ScheduledPost key={post.id} post={post} />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activePost && (
            <div className="bg-white rounded-lg shadow-lg border-2 border-blue-500 p-4">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">
                  {format(new Date(activePost.scheduledFor), 'PPp')}
                </span>
              </div>
              <p className="mt-2 text-gray-900">{activePost.content}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {filteredPosts.length === 0 && (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No scheduled posts</p>
          <p className="text-gray-400 text-sm mt-1">
            Try adjusting your date range or create new posts
          </p>
        </div>
      )}
    </div>
  );
}

function ScheduledPost({ post }: { post: Post }) {
  return (
    <div className="flex items-center space-x-4 bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow">
      <DragHandleDots2 className="h-5 w-5 text-gray-400 cursor-move" />
      <div className="flex-1">
        <div className="flex items-center text-sm text-gray-600 mb-1">
          <Clock className="h-4 w-4 mr-2" />
          {format(new Date(post.scheduledFor), 'PPp')}
        </div>
        <p className="text-gray-900">{post.content}</p>
        {post.firstComment && (
          <p className="text-sm text-gray-500 mt-1">
            First comment: {post.firstComment}
          </p>
        )}
        <div className="flex items-center mt-2 space-x-2">
          {post.selectedPages.map((page) => (
            <img
              key={page.id}
              src={page.picture?.data?.url}
              alt={page.name}
              className="w-6 h-6 rounded-full"
              title={page.name}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="secondary" size="sm">
          Edit
        </Button>
        <Button variant="secondary" size="sm">
          Delete
        </Button>
      </div>
    </div>
  );
}