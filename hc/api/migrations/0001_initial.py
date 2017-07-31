# -*- coding: utf-8 -*-
# Generated by Django 1.10.1 on 2017-07-31 08:23
from __future__ import unicode_literals

import datetime
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Channel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.UUIDField(default=uuid.uuid4, editable=False)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('kind', models.CharField(choices=[(b'email', b'Email'), (b'webhook', b'Webhook'), (b'hipchat', b'HipChat'), (b'slack', b'Slack'), (b'pd', b'PagerDuty'), (b'po', b'Pushover'), (b'pushbullet', b'Pushbullet'), (b'opsgenie', b'OpsGenie'), (b'victorops', b'VictorOps'), (b'discord', b'Discord')], max_length=20)),
                ('value', models.TextField(blank=True)),
                ('email_verified', models.BooleanField(default=False)),
            ],
        ),
        migrations.CreateModel(
            name='Check',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(blank=True, max_length=100)),
                ('tags', models.CharField(blank=True, max_length=500)),
                ('code', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('kind', models.CharField(choices=[(b'simple', b'Simple'), (b'cron', b'Cron')], default=b'simple', max_length=10)),
                ('timeout', models.DurationField(default=datetime.timedelta(1))),
                ('grace', models.DurationField(default=datetime.timedelta(0, 3600))),
                ('schedule', models.CharField(default=b'* * * * *', max_length=100)),
                ('tz', models.CharField(default=b'UTC', max_length=36)),
                ('n_pings', models.IntegerField(default=0)),
                ('last_ping', models.DateTimeField(blank=True, null=True)),
                ('alert_after', models.DateTimeField(blank=True, editable=False, null=True)),
                ('status', models.CharField(choices=[(b'up', b'Up'), (b'down', b'Down'), (b'new', b'New'), (b'paused', b'Paused')], default=b'new', max_length=6)),
                ('nag', models.DurationField(default=datetime.timedelta(1))),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('check_status', models.CharField(max_length=6)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('error', models.CharField(blank=True, max_length=200)),
                ('channel', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.Channel')),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.Check')),
            ],
            options={
                'get_latest_by': 'created',
            },
        ),
        migrations.CreateModel(
            name='Ping',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('n', models.IntegerField(null=True)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('scheme', models.CharField(default=b'http', max_length=10)),
                ('remote_addr', models.GenericIPAddressField(blank=True, null=True)),
                ('method', models.CharField(blank=True, max_length=10)),
                ('ua', models.CharField(blank=True, max_length=200)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.Check')),
            ],
        ),
        migrations.AddField(
            model_name='channel',
            name='checks',
            field=models.ManyToManyField(to='api.Check'),
        ),
        migrations.AddField(
            model_name='channel',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterIndexTogether(
            name='check',
            index_together=set([('status', 'user', 'alert_after')]),
        ),
    ]
