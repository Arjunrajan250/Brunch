import BrunchApp from '@/components/BrunchApp';

// The client-side catalog reads these paths for launches, creators, posts and
// other shareable views. Unknown paths resolve to the home view.
export default function DeepLinkPage() {
  return <BrunchApp />;
}
