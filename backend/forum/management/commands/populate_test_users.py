import random

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone


class Command(BaseCommand):
    help = "Create or update test users named UserX with userX@example.com emails."

    def add_arguments(self, parser):
        parser.add_argument("count", type=int, help="Number of test users to create.")
        parser.add_argument(
            "--start-index",
            type=int,
            default=1,
            help="First X value to use for UserX/userX@example.com. Defaults to 1.",
        )
        parser.add_argument(
            "--password",
            default="12345678",
            help="Password to set for every generated user. Defaults to 12345678.",
        )

    def handle(self, *args, **options):
        count = options["count"]
        start_index = options["start_index"]
        password = options["password"]

        if count < 1:
            raise CommandError("count must be at least 1.")
        if start_index < 1:
            raise CommandError("--start-index must be at least 1.")

        User = get_user_model()
        yesterday = timezone.localdate() - timezone.timedelta(days=1)
        genders = [
            User.GenderChoices.MALE,
            User.GenderChoices.FEMALE,
            User.GenderChoices.PREFER_NOT,
        ]

        created = 0
        updated = 0

        for index in range(start_index, start_index + count):
            user, was_created = User.objects.update_or_create(
                email=f"user{index}@example.com",
                defaults={
                    "name": f"User{index}",
                    "gender": random.choice(genders),
                    "birth_date": yesterday,
                    "is_active": True,
                },
            )
            user.set_password(password)
            user.full_clean(exclude=["password"])
            user.save()

            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Populated {count} test users: {created} created, {updated} updated."
            )
        )
