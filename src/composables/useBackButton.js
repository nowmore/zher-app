import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { App } from '@capacitor/app';


export function useBackButton() {
  const router = useRouter();
  let backButtonListener = null;

  onMounted(async () => {

    backButtonListener = await App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack && router.options.history.state.position > 0) {
        router.back();
      } else {
        App.minimizeApp();
      }
    });
  });

  onUnmounted(async () => {
    if (backButtonListener) {
      await backButtonListener.remove();
    }
  });
}
