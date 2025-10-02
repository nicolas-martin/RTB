import { useState, useEffect } from 'react';
import { supabase, type Comment } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';

interface CommentSectionProps {
  projectId: string;
}

export function CommentSection({ projectId }: CommentSectionProps) {
  const { account, isConnected, isAuthenticated, isLoading, connectWallet, authenticate } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load comments
  useEffect(() => {
    loadComments();
  }, [projectId]);

  const loadComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load comments:', error);
    }
    if (data) {
      console.log('Loaded comments:', data);
      setComments(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !newComment.trim()) return;

    try {
      setIsSubmitting(true);

      const { error } = await supabase.from('comments').insert({
        project_id: projectId,
        wallet_address: account.toLowerCase(),
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment('');
      await loadComments();
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="comment-section">
      <h3 style={{ marginBottom: '1rem' }}>Comments</h3>

      {/* Connect / Auth */}
      {!isConnected ? (
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={connectWallet}>Connect Wallet</button>
        </div>
      ) : !isAuthenticated ? (
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={authenticate} disabled={isLoading}>
            {isLoading ? 'Signing...' : 'Sign Message to Comment'}
          </button>
        </div>
      ) : (
        // Comment form
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            rows={4}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              marginBottom: '0.5rem',
            }}
          />
          <button type="submit" disabled={isSubmitting || !newComment.trim()}>
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      )}

      {/* Comments list */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <p style={{ color: '#666' }}>No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                padding: '1rem',
                borderRadius: '8px',
                backgroundColor: '#f5f5f5',
                marginBottom: '1rem',
                color: '#000',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#666',
                }}
              >
                <span style={{ fontWeight: 600 }}>
                  {formatAddress(comment.wallet_address)}
                </span>
                <span>{formatDate(comment.created_at)}</span>
              </div>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#333' }}>
                {comment.content || '(empty comment)'}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
