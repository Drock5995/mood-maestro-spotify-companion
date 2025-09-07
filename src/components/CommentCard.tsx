"use client";

import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export interface CommentWithProfile {
  id: string;
  comment_text: string;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface CommentCardProps {
  comment: CommentWithProfile;
}

export default function CommentCard({ comment }: CommentCardProps) {
  const ownerName = comment.profiles?.display_name || 'A User';
  const ownerAvatar = comment.profiles?.avatar_url || `https://i.pravatar.cc/40?u=${comment.user_id}`;
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

  return (
    <div className="flex items-start space-x-4 p-4">
      <Link href={`/profile/${comment.user_id}`}>
        <Image src={ownerAvatar} alt={ownerName} width={40} height={40} className="rounded-full" />
      </Link>
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <Link href={`/profile/${comment.user_id}`} className="font-bold hover:underline">
            {ownerName}
          </Link>
          <span className="text-xs text-gray-400">{timeAgo}</span>
        </div>
        <p className="text-gray-300 mt-1 whitespace-pre-wrap break-words">{comment.comment_text}</p>
      </div>
    </div>
  );
}