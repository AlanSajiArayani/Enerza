from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import UserProfile, REFITHousehold

class Command(BaseCommand):
    help = "Seed 20 Citizen demo accounts mapped to REFIT Households 1 to 20"

    def handle(self, *args, **options):
        self.stdout.write("Seeding 20 REFIT Household Citizen accounts (house01 .. house20)...")
        
        created_count = 0
        updated_count = 0

        for i in range(1, 21):
            username = f"house{i:02d}"
            password = f"EnerzaDemo{i:02d}!"
            email = f"house{i:02d}@refit-demo.local"
            first_name = "REFIT"
            last_name = f"Household {i:02d}"
            house_number = i
            display_name = f"REFIT Household {i:02d}"
            data_file = f"CLEAN_House{i}.csv"

            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'first_name': first_name,
                    'last_name': last_name,
                    'is_staff': False,
                    'is_superuser': False,
                    'is_active': True,
                }
            )

            # Always set password with Django password hashing
            user.set_password(password)
            user.is_staff = False
            user.is_superuser = False
            user.is_active = True
            user.save()

            # Ensure UserProfile exists and role is citizen
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.role = 'citizen'
            profile.save()

            # Create or update REFITHousehold assignment
            refit_house, h_created = REFITHousehold.objects.get_or_create(
                house_number=house_number,
                defaults={
                    'user': user,
                    'display_name': display_name,
                    'data_file': data_file,
                    'data_source': 'refit',
                    'is_active': True,
                }
            )

            if not h_created:
                refit_house.user = user
                refit_house.display_name = display_name
                refit_house.data_file = data_file
                refit_house.save()
                updated_count += 1
            else:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(
            f"Successfully processed 20 demo accounts ({created_count} created, {updated_count} updated)."
        ))
        
        self.stdout.write("\n--- ENERZA REFIT DEMO CREDENTIALS SUMMARY ---")
        self.stdout.write(f"{'Username':<12} | {'Assigned Household':<22} | {'Role':<8}")
        self.stdout.write("-" * 50)
        for i in range(1, 21):
            un = f"house{i:02d}"
            self.stdout.write(f"{un:<12} | REFIT Household {i:02d}      | citizen")
        self.stdout.write("=" * 50)
