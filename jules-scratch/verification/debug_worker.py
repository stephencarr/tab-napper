from playwright.sync_api import sync_playwright
import os

def run(playwright):
    path_to_extension = os.path.join(os.getcwd(), 'dist')
    user_data_dir = '/tmp/test-user-data-dir'

    context = playwright.chromium.launch_persistent_context(
        user_data_dir,
        headless=True,
        args=[
            f"--disable-extensions-except={path_to_extension}",
            f"--load-extension={path_to_extension}",
        ],
    )

    try:
        service_worker = context.wait_for_event("serviceworker", timeout=15000)
        print("Service worker found!")
        print(service_worker.url)
    except Exception as e:
        print(f"Error waiting for service worker: {e}")
    finally:
        context.close()

with sync_playwright() as playwright:
    run(playwright)
