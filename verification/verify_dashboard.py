from playwright.sync_api import sync_playwright, expect
import time

def verify_dashboard():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            # Navigate to dashboard
            print("Navigating to dashboard...")
            page.goto("http://localhost:3000")

            # Wait for main content
            print("Waiting for content to load...")
            page.wait_for_selector("h1", timeout=10000)

            # Check title
            title = page.locator("h1").first
            expect(title).to_contain_text("DEPLOYMENT OPS")
            print("Title verified.")

            # Check stats cards
            stats = page.locator(".recharts-responsive-container")
            expect(stats).to_be_visible()
            print("Stats chart verified.")

            # Check visualizer canvas
            canvas = page.locator("canvas").first
            expect(canvas).to_be_visible()
            print("Visualizer canvas verified.")

            # Wait a bit for animation to start
            time.sleep(2)

            # Take screenshot
            print("Taking screenshot...")
            page.screenshot(path="verification/dashboard_final.png", full_page=True)
            print("Screenshot saved to verification/dashboard_final.png")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_dashboard()
