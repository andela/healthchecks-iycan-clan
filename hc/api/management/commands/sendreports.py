from datetime import timedelta
import time
import kronos
from django.core.management.base import BaseCommand
from django.db.models import Q
from django.utils import timezone
from hc.accounts.models import Profile
from hc.api.models import Check


def num_pinged_checks(profile):
    q = Check.objects.filter(user_id=profile.user.id,)
    q = q.filter(last_ping__isnull=False)
    return q.count()

@kronos.register('0 0 * * *')

class Command(BaseCommand):
    help = 'Send due monthly reports'
    tmpl = "Sending monthly report to %s"

    def add_arguments(self, parser):
        parser.add_argument(
            '--loop',
            action='store_true',
            dest='loop',
            default=True,
            help='Keep running indefinitely in a 300 second wait loop',
        )

    def handle_one_run(self):
        now = timezone.now()
        period_before = now - timedelta(seconds=7)
        period_after = now + timedelta(seconds=7)

        report_due = Q(next_report_date__lt=period_after)
        report_not_scheduled = Q(next_report_date__isnull=False)

        q = Profile.objects.filter(report_due | report_not_scheduled)
        q = q.filter(reports_allowed=True)
        q = q.filter(user__date_joined__lt=period_before)
        profiles = list(q)

        sent = 0
        for profile in profiles:
            qq = Profile.objects
            qq = qq.filter(id=profile.id,
                           next_report_date=profile.next_report_date)

            num_updated = qq.update(next_report_date=period_after)


            self.stdout.write(self.tmpl % profile.user.email)
            profile.send_report()

            sent += 1

        return sent

    def handle(self, *args, **options):
        if not options["loop"]:
            return "Sent %d reports" % self.handle_one_run()

        self.stdout.write("sendreports is now running")
        while True:
            self.handle_one_run()

            formatted = timezone.now().isoformat()
            self.stdout.write("-- MARK %s --" % formatted)

            time.sleep(7)
