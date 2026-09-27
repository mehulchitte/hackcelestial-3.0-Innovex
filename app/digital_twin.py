import os, math, requests
from datetime import datetime, timezone

OPEN_METEO = "https://api.open-meteo.com/v1/forecast"


def get_weather(lat=19.0760, lon=72.8777):
    params={
        "latitude":lat,"longitude":lon,
        "current":"temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
        "hourly":"temperature_2m,precipitation_probability,precipitation,wind_speed_10m,weather_code",
        "forecast_days":2,"timezone":"auto"
    }
    r=requests.get(OPEN_METEO,params=params,timeout=12); r.raise_for_status(); d=r.json()
    c=d.get("current",{})
    return {"latitude":lat,"longitude":lon,"timezone":d.get("timezone"),"location_name":os.getenv("RESORT_LOCATION_NAME","ResortOS Resort"),"current":c,"hourly":d.get("hourly",{})}


def weather_label(code):
    try: code=int(code)
    except: return "Unknown"
    if code==0:return "Clear"
    if code in (1,2,3):return "Partly cloudy"
    if code in (45,48):return "Fog"
    if code in (51,53,55,56,57):return "Drizzle"
    if code in (61,63,65,66,67):return "Rain"
    if code in (71,73,75,77):return "Snow"
    if code in (80,81,82):return "Rain showers"
    if code in (95,96,99):return "Thunderstorm"
    return "Mixed"


def simulate_twin(weather, rooms, bookings, issues, tasks, social_count=0, overrides=None):
    """Deterministic Digital Twin layer. It estimates a virtual future state from live weather + resort state.
    These are simulations, not live operational changes. AI can add an explanatory layer on top.
    """
    overrides=overrides or {}
    cur=weather.get("current",{}) or {}
    temp=float(overrides.get("temperature",cur.get("temperature_2m",28)) or 28)
    rain=float(overrides.get("rainfall",cur.get("precipitation",0)) or 0)
    wind=float(overrides.get("wind",cur.get("wind_speed_10m",10)) or 10)
    duration=max(0.25,float(overrides.get("duration",1) or 1))
    intensity=max(0,min(100,float(overrides.get("intensity", min(100,rain*25)) or 0)))

    heat=max(0,(temp-32)*2.2)
    cold=max(0,(18-temp)*1.2)
    rain_factor=min(1, rain/20 + intensity/180)
    storm_factor=min(1, (wind/70)*0.55 + (intensity/100)*0.65)
    visibility_factor=min(1, rain_factor*0.7 + storm_factor*0.35)
    extreme=1 if temp>=40 or rain>=20 or wind>=60 or intensity>=80 else 0

    total=max(1,len(rooms)); occupied=sum(1 for r in rooms if r.status=="Occupied")
    available=sum(1 for r in rooms if r.status=="Available")
    maintenance_rooms=sum(1 for r in rooms if r.status=="Maintenance")
    occupancy=(occupied/total)*100
    base_demand=min(100, 48 + occupancy*0.42 + max(0,35-temp)*0.12)
    demand=max(0,min(100,base_demand + rain_factor*18 + storm_factor*10 - heat*0.7))

    open_tasks=sum(1 for t in tasks if t.status!="Completed")
    open_issues=sum(1 for i in issues if i.status!="Resolved")
    hk_load=open_tasks + round(total*(rain_factor*0.12 + storm_factor*0.08))
    maint_risk=min(100, 8 + rain_factor*36 + storm_factor*32 + heat*1.4 + extreme*12)
    movement=min(100, rain_factor*75 + storm_factor*55)
    room_availability=max(0,100 - (occupancy + maint_risk*0.22))
    predicted_issues=round(open_issues + maint_risk/18 + hk_load*0.06)

    # Virtual downstream demand/traffic effects. These never modify bookings.
    arrival_delay_min=round(min(180, movement*1.35 + duration*4 + visibility_factor*18))
    traffic_congestion=min(100, round(movement*0.78 + (social_count*2 if social_count else 0)))
    guest_mobility=min(100, round(100 - movement*0.72))
    outdoor_activity_drop=min(100, round(rain_factor*62 + storm_factor*35 + heat*0.6))
    restaurant_demand=min(100, round(demand + (18 if rain_factor>0.4 else 0) - outdoor_activity_drop*0.15))
    room_service_demand=min(100, round(35 + demand*0.38 + rain_factor*22))
    hvac_load=min(100, round(45 + max(0,temp-24)*2.6 + cold*1.8))
    power_load=min(100, round(42 + hvac_load*0.42 + rain_factor*8))
    staffing_pressure=min(100, round((hk_load/max(1,total))*100 + movement*0.28 + demand*0.18))
    cancellation_risk=min(100, round(movement*0.22 + extreme*12 + max(0,rain-12)*1.8))
    supply_chain_delay=min(100, round(traffic_congestion*0.35 + movement*0.18))
    uncertainty=min(35,7+rain_factor*12+storm_factor*11+(8 if social_count else 0))

    cascade=[]
    if traffic_congestion>35: cascade += ["Road movement becomes slower", "Arrival/departure buffers should increase"]
    if rain_factor>0.45: cascade += ["Outdoor activity demand shifts indoors", "Housekeeping workload rises"]
    if storm_factor>0.45: cascade += ["Maintenance exposure rises", "Transport delays become more likely"]
    if heat>5: cascade += ["Cooling demand rises", "HVAC and power load increase"]
    if restaurant_demand>65: cascade += ["Indoor dining demand may increase", "F&B staffing pressure may rise"]
    if not cascade: cascade=["No major cascading impact detected"]

    actions=[]
    if traffic_congestion>45: actions.append("Add arrival/departure buffer and monitor transport access")
    if hk_load>open_tasks: actions.append("Prepare additional housekeeping capacity")
    if maint_risk>45: actions.append("Pre-check HVAC, drainage and exposed equipment")
    if restaurant_demand>70: actions.append("Prepare indoor dining capacity and F&B staffing")
    if staffing_pressure>60: actions.append("Review shift coverage before the weather window")
    if not actions: actions.append("Continue monitoring live conditions")

    # 6-hour virtual trajectory: simple propagation, intentionally transparent.
    trajectory=[]
    for hour in range(0,7,2):
        factor=max(0.25,1-(hour/(max(2,duration*2.0)))) if duration else 1
        trajectory.append({
            "hour":hour,
            "movement_risk":round(min(100,movement*(0.75+0.25*factor)),1),
            "traffic":round(min(100,traffic_congestion*(0.70+0.30*factor)),1),
            "maintenance":round(min(100,maint_risk*(0.78+0.22*factor)),1),
            "demand":round(min(100,demand*(0.88+0.12*factor)),1)
        })

    return {
        "weather": {"temperature":round(temp,1),"rainfall":round(rain,2),"wind":round(wind,1),"intensity":round(intensity,1),"duration":round(duration,1),"label":weather_label(cur.get("weather_code"))},
        "state": {"occupancy_pct":round(occupancy,1),"rooms_total":total,"rooms_occupied":occupied,"rooms_available":available,"rooms_maintenance":maintenance_rooms,"open_issues":open_issues,"pending_tasks":open_tasks},
        "prediction": {
            "demand_index":round(demand,1),"housekeeping_load":hk_load,"maintenance_risk_pct":round(maint_risk,1),"movement_disruption_pct":round(movement,1),"room_availability_pct":round(room_availability,1),"predicted_open_issues":predicted_issues,"extreme":bool(extreme),"uncertainty_pct":round(uncertainty,1),
            "traffic_congestion_pct":traffic_congestion,"arrival_delay_min":arrival_delay_min,"guest_mobility_pct":guest_mobility,"outdoor_activity_drop_pct":outdoor_activity_drop,"restaurant_demand_pct":restaurant_demand,"room_service_demand_pct":room_service_demand,"hvac_load_pct":hvac_load,"power_load_pct":power_load,"staffing_pressure_pct":staffing_pressure,"cancellation_risk_pct":cancellation_risk,"supply_chain_delay_pct":supply_chain_delay
        },
        "cascades":cascade,
        "recommended_actions":actions,
        "trajectory":trajectory,
        "methodology":{"weather_signal":"Live forecast/current conditions","operational_signal":"Resort rooms, bookings, issues and tasks","social_signal_count":social_count,"simulation_only":True},
        "generated_at":datetime.now(timezone.utc).isoformat()
    }
