import logging
import sys
from loguru import logger

class InterceptHandler(logging.Handler):
    """
    Custom handler to redirect standard logging library records to Loguru.
    """
    def emit(self, record):
        # Try to get corresponding Loguru level
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        # Find caller of the logged message to preserve file and line number context
        frame = sys._getframe(6)
        depth = 6
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())

def setup_logging():
    # Remove default handlers from the root logger
    logging.root.handlers = []

    # Configure loguru default stdout sink
    logger.configure(
        handlers=[
            {
                "sink": sys.stdout,
                "format": "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
            }
        ]
    )

    # Route all standard logging library events through InterceptHandler
    logging.basicConfig(handlers=[InterceptHandler()], level=logging.INFO)

    # Specifically intercept uvicorn and fastapi logs to prevent duplicate entries
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access", "fastapi"):
        logging_logger = logging.getLogger(name)
        logging_logger.handlers = [InterceptHandler()]
        logging_logger.propagate = False

    # Silence noisy loggers
    for noisy_logger in ("httpcore", "httpx", "hpack", "supabase"):
        logging_logger = logging.getLogger(noisy_logger)
        logging_logger.setLevel(logging.WARNING)
