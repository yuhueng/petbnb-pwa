# SQL Force Add Review Guide

```sql
-- Add diverse reviews
INSERT INTO reviews (reviewer_id, sitter_id, rating, comment, is_visible) VALUES
  ('owner-a', 'sitter-id-123', 5, 'Sarah was absolutely wonderful with my golden retriever! She sent me daily photos and videos, and my dog was so happy when I picked him up. Highly recommend!', true),
  ('owner-b', 'sitter-id-123', 4, 'Great experience overall. Sarah was very professional and followed all my instructions for my cat''s medication. My cat seemed comfortable and well-cared for. Would book again!', true),
  ('owner-c', 'sitter-id-123', 5, 'Outstanding service! Sarah went above and beyond. She not only took great care of my two dogs but also sent me detailed updates about their activities, meals, and bathroom breaks. Best sitter we''ve had!', true);

-- Add diverse reviews with specific timestamp
INSERT INTO reviews (reviewer_id, sitter_id, rating, comment, created_at, is_visible) VALUES
  ('owner-a', 'sitter-id-123', 5, 'Sarah was absolutely wonderful with my golden retriever! She sent me daily photos and videos, and my dog was so happy when I picked him up. Highly recommend!', true),
  ('owner-b', 'sitter-id-123', 4, 'Great experience overall. Sarah was very professional and followed all my instructions for my cat''s medication. My cat seemed comfortable and well-cared for. Would book again!', true),
  ('owner-c', 'sitter-id-123', 5, 'Outstanding service! Sarah went above and beyond. She not only took great care of my two dogs but also sent me detailed updates about their activities, meals, and bathroom breaks. Best sitter we''ve had!', true);