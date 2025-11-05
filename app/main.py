from fastapi import FastAPI, Request, HTTPException, Depends, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.templating import Jinja2Templates
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from . import database, models, schemas

app = FastAPI(title="Email Sorter")

models.Base.metadata.create_all(bind=database.engine)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )


@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


# Email Rules API
@app.get("/api/rules", response_model=List[schemas.EmailRuleResponse])
async def get_rules(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.EmailRule)
    if search:
        query = query.filter(
            or_(
                models.EmailRule.name.ilike(f"%{search}%"),
                models.EmailRule.conditions.ilike(f"%{search}%"),
                models.EmailRule.actions.ilike(f"%{search}%")
            )
        )
    rules = query.order_by(models.EmailRule.priority.desc(), models.EmailRule.created_at.desc()).offset(skip).limit(limit).all()
    return rules


@app.get("/api/rules/{rule_id}", response_model=schemas.EmailRuleResponse)
async def get_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(models.EmailRule).filter(models.EmailRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule


@app.post("/api/rules", response_model=schemas.EmailRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_rule(rule: schemas.EmailRuleCreate, db: Session = Depends(get_db)):
    existing = db.query(models.EmailRule).filter(models.EmailRule.name == rule.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Rule with this name already exists")
    
    db_rule = models.EmailRule(**rule.model_dump())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule


@app.put("/api/rules/{rule_id}", response_model=schemas.EmailRuleResponse)
async def update_rule(rule_id: int, rule: schemas.EmailRuleUpdate, db: Session = Depends(get_db)):
    db_rule = db.query(models.EmailRule).filter(models.EmailRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    update_data = rule.model_dump(exclude_unset=True)
    
    if "name" in update_data:
        existing = db.query(models.EmailRule).filter(
            models.EmailRule.name == update_data["name"],
            models.EmailRule.id != rule_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Rule with this name already exists")
    
    for field, value in update_data.items():
        setattr(db_rule, field, value)
    
    db.commit()
    db.refresh(db_rule)
    return db_rule


@app.delete("/api/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(rule_id: int, db: Session = Depends(get_db)):
    db_rule = db.query(models.EmailRule).filter(models.EmailRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(db_rule)
    db.commit()
    return None


@app.patch("/api/rules/{rule_id}/toggle", response_model=schemas.EmailRuleResponse)
async def toggle_rule(rule_id: int, db: Session = Depends(get_db)):
    db_rule = db.query(models.EmailRule).filter(models.EmailRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db_rule.is_active = not db_rule.is_active
    db.commit()
    db.refresh(db_rule)
    return db_rule


# Email Templates API
@app.get("/api/templates", response_model=List[schemas.EmailTemplateResponse])
async def get_templates(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.EmailTemplate)
    if search:
        query = query.filter(
            or_(
                models.EmailTemplate.name.ilike(f"%{search}%"),
                models.EmailTemplate.subject.ilike(f"%{search}%"),
                models.EmailTemplate.body.ilike(f"%{search}%")
            )
        )
    if category:
        query = query.filter(models.EmailTemplate.category == category)
    templates = query.order_by(models.EmailTemplate.created_at.desc()).offset(skip).limit(limit).all()
    return templates


@app.get("/api/templates/{template_id}", response_model=schemas.EmailTemplateResponse)
async def get_template(template_id: int, db: Session = Depends(get_db)):
    template = db.query(models.EmailTemplate).filter(models.EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@app.post("/api/templates", response_model=schemas.EmailTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(template: schemas.EmailTemplateCreate, db: Session = Depends(get_db)):
    existing = db.query(models.EmailTemplate).filter(models.EmailTemplate.name == template.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Template with this name already exists")
    
    db_template = models.EmailTemplate(**template.model_dump())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template


@app.put("/api/templates/{template_id}", response_model=schemas.EmailTemplateResponse)
async def update_template(template_id: int, template: schemas.EmailTemplateUpdate, db: Session = Depends(get_db)):
    db_template = db.query(models.EmailTemplate).filter(models.EmailTemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    update_data = template.model_dump(exclude_unset=True)
    
    if "name" in update_data:
        existing = db.query(models.EmailTemplate).filter(
            models.EmailTemplate.name == update_data["name"],
            models.EmailTemplate.id != template_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Template with this name already exists")
    
    for field, value in update_data.items():
        setattr(db_template, field, value)
    
    db.commit()
    db.refresh(db_template)
    return db_template


@app.delete("/api/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(template_id: int, db: Session = Depends(get_db)):
    db_template = db.query(models.EmailTemplate).filter(models.EmailTemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(db_template)
    db.commit()
    return None


# Stats API
@app.get("/api/stats", response_model=schemas.StatsResponse)
async def get_stats(db: Session = Depends(get_db)):
    total_rules = db.query(func.count(models.EmailRule.id)).scalar()
    active_rules = db.query(func.count(models.EmailRule.id)).filter(models.EmailRule.is_active == True).scalar()
    inactive_rules = total_rules - active_rules
    total_templates = db.query(func.count(models.EmailTemplate.id)).scalar()
    
    templates_by_category = {}
    category_counts = db.query(
        models.EmailTemplate.category,
        func.count(models.EmailTemplate.id)
    ).group_by(models.EmailTemplate.category).all()
    
    for category, count in category_counts:
        templates_by_category[category] = count
    
    return {
        "total_rules": total_rules or 0,
        "active_rules": active_rules or 0,
        "inactive_rules": inactive_rules or 0,
        "total_templates": total_templates or 0,
        "templates_by_category": templates_by_category
    }
