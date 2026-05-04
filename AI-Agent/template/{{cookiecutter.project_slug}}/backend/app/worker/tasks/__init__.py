{%- if cookiecutter.use_celery or cookiecutter.use_taskiq or cookiecutter.use_arq %}
"""Background tasks."""

{%- if cookiecutter.use_celery %}
from app.worker.tasks.examples import example_task, long_running_task
{%- if cookiecutter.enable_rag %}
from app.worker.tasks.rag_tasks import ingest_document_task, sync_single_source_task, check_scheduled_syncs
{%- endif %}
{%- endif %}

{%- if cookiecutter.use_taskiq %}
from app.worker.tasks.taskiq_examples import example_task as taskiq_example_task
from app.worker.tasks.taskiq_examples import long_running_task as taskiq_long_running_task
{%- if cookiecutter.enable_rag %}
from app.worker.tasks.rag_tasks import ingest_document_task  # noqa: F811
from app.worker.tasks.rag_tasks import sync_single_source_task, check_scheduled_syncs  # noqa: F811
{%- endif %}
{%- endif %}

{%- if cookiecutter.use_arq %}
from app.worker.arq_app import example_task as arq_example_task
from app.worker.arq_app import long_running_task as arq_long_running_task
{%- endif %}

__all__ = [
{%- if cookiecutter.use_celery %}
    "example_task",
    "long_running_task",
{%- if cookiecutter.enable_rag %}
    "ingest_document_task",
    "sync_single_source_task",
    "check_scheduled_syncs",
{%- endif %}
{%- endif %}
{%- if cookiecutter.use_taskiq %}
    "taskiq_example_task",
    "taskiq_long_running_task",
{%- if cookiecutter.enable_rag %}
    "sync_single_source_task",
    "check_scheduled_syncs",
{%- endif %}
{%- endif %}
{%- if cookiecutter.use_arq %}
    "arq_example_task",
    "arq_long_running_task",
{%- endif %}
]
{%- else %}
# Background tasks not enabled
{%- endif %}
