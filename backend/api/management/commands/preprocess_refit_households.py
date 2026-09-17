from django.core.management.base import BaseCommand
from api.analytics.preprocessing import load_and_preprocess

class Command(BaseCommand):
    help = "Preprocess and Parquet-cache all 20 REFIT households sequentially"

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force re-preprocessing even if cache files exist',
        )

    def handle(self, *args, **options):
        force = options.get('force', False)
        self.stdout.write("Starting bulk preprocessing for 20 REFIT households...")

        success_count = 0
        for house_number in range(1, 21):
            self.stdout.write(f"[{house_number:02d}/20] Processing House {house_number}...")
            try:
                # load_and_preprocess handles cache checking and auto-generation
                load_and_preprocess(house_number=house_number, include_minute=False)
                self.stdout.write(self.style.SUCCESS(f"  [OK] House {house_number} ready."))
                success_count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  [FAIL] House {house_number} failed: {e}"))

        self.stdout.write(self.style.SUCCESS(
            f"Bulk preprocessing finished: {success_count}/20 households processed successfully."
        ))
