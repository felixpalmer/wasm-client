export const compaintsByYearSql = `
from sample_data.nyc.service_requests
select year(created_date)::int as Year, count(*)::int as Complaints
where Year < 2023
and agency_name = 'New York City Police Department'
group by 1
order by 1
`;

export const complaintTypesForYearSql = (year: number) => `
from sample_data.nyc.service_requests
select complaint_type as Type, longitude, latitude
where year(created_date) < 2023
and agency_name = 'New York City Police Department'
and year(created_date) = ${year}
limit 10000
`;
