from celery import shared_task


@shared_task
def run_anxiety_prediction(health_data_id):
    """Placeholder task for async anxiety prediction."""
    return {"health_data_id": health_data_id, "status": "pending"}
