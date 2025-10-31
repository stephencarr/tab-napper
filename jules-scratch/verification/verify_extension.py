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

    # Get the extension ID
    if context.service_workers:
        service_worker = context.service_workers[0]
    else:
        service_worker = context.wait_for_event("serviceworker")

    extension_id = service_worker.url.split('/')[2]

    page = context.new_page()

    # Verify triage_hub.html
    page.goto(f"chrome-extension://{extension_id}/triage_hub.html")
    page.screenshot(path="jules-scratch/verification/triage_hub_ext.png")

    # Verify note.html
    page.goto(f"chrome-extension://{extension_id}/note.html")
    page.screenshot(path="jules-scratch/verification/note_ext.png")

    context.close()

with sync_playwright() as playwright:
    run(playwright)
