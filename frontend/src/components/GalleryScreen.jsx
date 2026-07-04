import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export function GalleryScreen() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/gallery?limit=50`);
        if (!response.ok) throw new Error('Failed to fetch gallery images');
        const data = await response.json();
        setImages(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGallery();
  }, []);

  return (
    <div className="gallery-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <ImageIcon size={32} color="var(--primary)" />
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>Public Gallery</h2>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        </div>
      ) : error ? (
        <div className="error-banner glass-panel" style={{ color: 'var(--accent)', textAlign: 'center' }}>
          <p>Failed to load gallery: {error}</p>
        </div>
      ) : images.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem' }}>The gallery is currently empty. Be the first to submit a drawing!</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {images.map((item) => (
            <div key={item.id} className="glass-panel" style={{ overflow: 'hidden', padding: '0', display: 'flex', flexDirection: 'column' }}>
              <img 
                src={item.image_url} 
                alt={`Drawing by ${item.player_name}`} 
                style={{ width: '100%', height: '250px', objectFit: 'cover', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                loading="lazy"
              />
              <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: '0', fontWeight: 'bold', color: 'white' }}>{item.player_name}</h3>
                  <span style={{ 
                    backgroundColor: 'rgba(99, 102, 241, 0.2)', 
                    color: 'var(--primary)', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '999px', 
                    fontSize: '0.875rem', 
                    fontWeight: 'bold' 
                  }}>
                    {item.score} pts
                  </span>
                </div>
                <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <strong>Objective:</strong> {item.objective}
                </p>
                {item.twist && (
                  <p style={{ margin: '0', color: 'var(--text-primary)', fontSize: '0.875rem', fontStyle: 'italic', borderLeft: '2px solid var(--accent)', paddingLeft: '0.75rem' }}>
                    "{item.twist}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
