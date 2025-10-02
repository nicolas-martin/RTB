import { AuthProvider } from '../lib/useAuth';
import { CommentSection } from './CommentSection';
import { RatingSection } from './RatingSection';

interface QuestCommentsProps {
  projectId: string;
}

export function QuestComments({ projectId }: QuestCommentsProps) {
  return (
    <AuthProvider>
      <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 1rem' }}>
        <RatingSection projectId={projectId} />
        <CommentSection projectId={projectId} />
      </div>
    </AuthProvider>
  );
}
