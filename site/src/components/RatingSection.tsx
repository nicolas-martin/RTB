import { useState, useEffect } from 'react';
import { supabase, type Rating } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';

interface RatingSectionProps {
  projectId: string;
}

export function RatingSection({ projectId }: RatingSectionProps) {
  const { account, isConnected, isAuthenticated, isLoading, connectWallet, authenticate } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load ratings
  useEffect(() => {
    loadRatings();
  }, [projectId, account]);

  const loadRatings = async () => {
    const { data } = await supabase
      .from('ratings')
      .select('*')
      .eq('project_id', projectId);

    if (data) {
      setRatings(data);

      // Find user's rating
      if (account) {
        const existing = data.find(
          (r) => r.wallet_address.toLowerCase() === account.toLowerCase()
        );
        setUserRating(existing?.rating || null);
      }
    }
  };

  const handleRate = async (rating: number) => {
    if (!account || !isAuthenticated) return;

    try {
      setIsSubmitting(true);

      const { error } = await supabase.from('ratings').upsert(
        {
          project_id: projectId,
          wallet_address: account.toLowerCase(),
          rating,
        },
        {
          onConflict: 'project_id,wallet_address',
        }
      );

      if (error) throw error;

      setUserRating(rating);
      await loadRatings();
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating = ratings.length
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0;

  const renderStars = (interactive = false) => {
    return [1, 2, 3, 4, 5].map((star) => {
      const filled = interactive
        ? hoverRating
          ? star <= hoverRating
          : userRating
          ? star <= userRating
          : false
        : star <= Math.round(averageRating);

      return (
        <span
          key={star}
          onClick={() => interactive && isAuthenticated && handleRate(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(null)}
          style={{
            fontSize: '2rem',
            cursor: interactive && isAuthenticated ? 'pointer' : 'default',
            color: filled ? '#FFD700' : '#ddd',
            transition: 'color 0.2s',
          }}
        >
          ★
        </span>
      );
    });
  };

  return (
    <div className="rating-section" style={{ marginBottom: '2rem' }}>
      <h3 style={{ marginBottom: '1rem' }}>Rating</h3>

      {/* Average rating display */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>{renderStars(false)}</div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            {averageRating > 0 ? (
              <>
                {averageRating.toFixed(1)} ({ratings.length}{' '}
                {ratings.length === 1 ? 'rating' : 'ratings'})
              </>
            ) : (
              'No ratings yet'
            )}
          </div>
        </div>
      </div>

      {/* User rating */}
      {!isConnected ? (
        <div>
          <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            Connect wallet to rate
          </p>
          <button onClick={connectWallet}>Connect Wallet</button>
        </div>
      ) : !isAuthenticated ? (
        <div>
          <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            Sign message to rate
          </p>
          <button onClick={authenticate} disabled={isLoading}>
            {isLoading ? 'Signing...' : 'Sign Message'}
          </button>
        </div>
      ) : (
        <div>
          <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            {userRating ? 'Your rating:' : 'Rate this project:'}
          </p>
          <div>{renderStars(true)}</div>
          {isSubmitting && (
            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
              Submitting...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
