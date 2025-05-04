fullMark: 100,
                          },
                          {
                            subject: 'GDP Per Capita',
                            A: Math.min(correlationData[correlationData.length - 1]['GDP Per Capita'] / 50000 * 100, 100),
                            fullMark: 100,
                          },
                          {
                            subject: 'Low Birth Rate',
                            A: Math.max(0, 100 - (healthData[healthData.length - 1]['Birth Rate'] / 40 * 100)),
                            fullMark: 100,
                          },
                          {
                            subject: 'Low Mortality',
                            A: Math.max(0, 100 - (healthData[healthData.length - 1]['Death Rate'] / 20 * 100)),
                            fullMark: 100,
                          },
                          {
                            subject: 'Urbanization',
                            A: urbanRuralData.length > 0 ? urbanRuralData[urbanRuralData.length - 1].UrbanPercentage : 0,
                            fullMark: 100,
                          },
                        ]}
                      >
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar 
                          name="Current Year" 
                          dataKey="A" 
                          stroke="#8884d8" 
                          fill="#8884d8" 
                          fillOpacity={0.6} 
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                    <p className="text-center text-sm text-gray-500 mt-2">
                      Development factors normalized to percentage scale
                    </p>
                  </>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Population & Development Dashboard</p>
          <p>Data sourced from CountryStats - Population.csv</p>
        </div>
      </div>
    </div>
  );
}import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, Users, Home, Activity, DollarSign, Calendar, Maximize2, ChevronRight, ChevronLeft } from 'lucide-react';

export default function PopulationDashboard() {
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState('population');
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState({ start: 1960, end: 2025 });
  const [activePeriod, setActivePeriod] = useState('all');
  const [highlighted, setHighlighted] = useState(null);
  
  const COLORS = ['#4C51BF', '#68D391', '#F6AD55', '#FC8181', '#B794F4'];

  useEffect(() => {
    const parseCSV = async () => {
      try {
        setIsLoading(true);
        const response = await window.fs.readFile('CountryStats - Population.csv', { encoding: 'utf8' });
        
        // Use PapaParse to parse the CSV
        window.Papa.parse(response, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (result) => {
            // Clean up data - convert string numbers to actual numbers
            const cleanedData = result.data.map(row => {
              const newRow = {...row};
              // Clean population values
              if (typeof newRow.Population === 'string') {
                newRow.Population = Number(newRow.Population.replace(/[^\d.-]/g, ''));
              }
              if (typeof newRow.UrbanPopulation === 'string') {
                newRow.UrbanPopulation = Number(newRow.UrbanPopulation.replace(/[^\d.-]/g, ''));
              }
              if (typeof newRow.RuralPopulation === 'string') {
                newRow.RuralPopulation = Number(newRow.RuralPopulation.replace(/[^\d.-]/g, ''));
              }
              
              // Clean economic values
              if (typeof newRow.GDP_USD === 'string') {
                newRow.GDP_USD = parseFloat(newRow.GDP_USD.replace(/[^\d.-]/g, ''));
              }
              if (typeof newRow.GDP_Per_Capita === 'string') {
                newRow.GDP_Per_Capita = parseFloat(newRow.GDP_Per_Capita.replace(/[^\d.-]/g, ''));
              }
              
              // Calculate additional metrics
              if (newRow.UrbanPopulation && newRow.Population) {
                newRow.UrbanizationRate = (newRow.UrbanPopulation / newRow.Population) * 100;
              }
              
              // Calculate annual growth rate
              if (newRow.PopulationGrowthRate && typeof newRow.PopulationGrowthRate === 'string') {
                newRow.PopulationGrowthRate = parseFloat(newRow.PopulationGrowthRate.replace(/%/g, ''));
              }
              
              return newRow;
            });
            
            // Sort by year descending
            cleanedData.sort((a, b) => a.YEAR - b.YEAR);
            setData(cleanedData);
            setIsLoading(false);
          }
        });
      } catch (error) {
        console.error("Error loading data:", error);
        setIsLoading(false);
      }
    };
    
    parseCSV();
  }, []);

  // Handle time period filtering
  const handlePeriodSelection = (period) => {
    setActivePeriod(period);
    let start = 1950;
    let end = 2025;
    
    switch(period) {
      case 'recent':
        start = 2000;
        break;
      case 'mid':
        start = 1980;
        end = 1999;
        break;
      case 'early':
        end = 1979;
        break;
      default:
        // All data
    }
    
    setTimeRange({ start, end });
  };

  // Filter data based on time range
  const filteredData = data
    .filter(item => item.YEAR >= timeRange.start && item.YEAR <= timeRange.end)
    .sort((a, b) => a.YEAR - b.YEAR);

  // Calculate trend metrics
  const calculateGrowthTrend = () => {
    if (filteredData.length < 2) return { trend: 0, percent: 0 };
    
    const oldestData = filteredData[0];
    const newestData = filteredData[filteredData.length - 1];
    
    if (!oldestData?.Population || !newestData?.Population) return { trend: 0, percent: 0 };
    
    const growthAbsolute = newestData.Population - oldestData.Population;
    const growthPercent = ((newestData.Population / oldestData.Population) - 1) * 100;
    
    return {
      trend: growthAbsolute > 0 ? 'up' : 'down',
      percent: growthPercent.toFixed(1),
      absolute: (growthAbsolute / 1000000).toFixed(1) // In millions
    };
  };
  
  const populationTrend = calculateGrowthTrend();

  // Create dataset for Urban vs Rural population
  const urbanRuralData = filteredData
    .filter(item => item.UrbanPopulation && item.RuralPopulation)
    .map(item => ({
      year: item.YEAR,
      Urban: item.UrbanPopulation / 1000000,
      Rural: item.RuralPopulation / 1000000,
      UrbanPercentage: (item.UrbanPopulation / item.Population) * 100,
      RuralPercentage: (item.RuralPopulation / item.Population) * 100
    }));

  // Create dataset for health indicators
  const healthData = filteredData.map(item => ({
    year: item.YEAR,
    'Life Expectancy': item.LifeExpectancy,
    'Birth Rate': item.BirthRate,
    'Death Rate': item.DeathRate,
    'Infant Mortality': item.InfantMortalityRate / 10, // Scaled for better visualization
    'Fertility Rate': item.FertilityRate
  }));

  // Create dataset for economic indicators
  const economicData = filteredData
    .filter(item => item.GDP_USD && item.Population)
    .map(item => ({
      year: item.YEAR,
      'GDP (Billions USD)': item.GDP_USD,
      'GDP Per Capita': item.GDP_Per_Capita,
      'Population (Millions)': item.Population / 1000000
    }));

  // Create dataset for demographic transition
  const demographicTransitionData = filteredData
    .filter(item => item.BirthRate && item.DeathRate)
    .map(item => ({
      year: item.YEAR,
      BirthRate: item.BirthRate,
      DeathRate: item.DeathRate,
      NaturalGrowth: item.BirthRate - item.DeathRate,
      FertilityRate: item.FertilityRate,
      LifeExpectancy: item.LifeExpectancy
    }));
    
  // Create correlation data for scatter plots
  const correlationData = filteredData
    .filter(item => item.GDP_Per_Capita && item.LifeExpectancy)
    .map(item => ({
      year: item.YEAR,
      'GDP Per Capita': item.GDP_Per_Capita,
      'Life Expectancy': item.LifeExpectancy,
      'Birth Rate': item.BirthRate,
      'Fertility Rate': item.FertilityRate,
      'Population (Millions)': item.Population / 1000000
    }));

  // Latest year for pie chart
  const latestYear = data.length > 0 ? 
    [...data].sort((a, b) => b.YEAR - a.YEAR).find(item => item.UrbanPopulation && item.RuralPopulation) : 
    null;
  
  const urbanRuralPieData = latestYear ? [
    { name: 'Urban', value: latestYear.UrbanPopulation, color: '#4C51BF' },
    { name: 'Rural', value: latestYear.RuralPopulation, color: '#68D391' }
  ] : [];

  const handleRangeChange = (e) => {
    const { name, value } = e.target;
    setTimeRange(prev => ({ ...prev, [name]: Number(value) }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-xl text-gray-600">Loading data...</p>
      </div>
    );
  }

  // Generate custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-md">
          <p className="font-bold text-lg">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Population & Development Dashboard
          </h1>
          
          <div className="flex gap-2">
            <button 
              className={`px-3 py-2 text-sm font-medium rounded-md ${activePeriod === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              onClick={() => handlePeriodSelection('all')}
            >
              All Time
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium rounded-md ${activePeriod === 'recent' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              onClick={() => handlePeriodSelection('recent')}
            >
              Recent (2000-2025)
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium rounded-md ${activePeriod === 'mid' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              onClick={() => handlePeriodSelection('mid')}
            >
              Mid (1980-1999)
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium rounded-md ${activePeriod === 'early' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              onClick={() => handlePeriodSelection('early')}
            >
              Early (1950-1979)
            </button>
          </div>
        
        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Population Trends Tab */}
          {activeTab === 'population' && (
            <>
              <div className="bg-white p-4 rounded-xl shadow">
                <h3 className="text-lg font-semibold mb-4">Total Population (Millions)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={filteredData.map(item => ({
                      year: item.YEAR,
                      Population: item.Population / 1000000
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="Population" 
                      stroke="#4C51BF" 
                      fill="#4C51BF" 
                      fillOpacity={0.3} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Multi-factor Development Radar</h3>
                {healthData.length > 0 && correlationData.length > 0 && (
                  <>
                    <ResponsiveContainer width="100%" height={400}>
                      <RadarChart 
                        cx="50%" 
                        cy="50%" 
                        outerRadius="80%" 
                        data={[
                          {
                            subject: 'Life Expectancy',
                            A: healthData[healthData.length - 1]['Life Expectancy'] / 90 * 100,
                            fullMark: 
              
              <div className="bg-white p-4 rounded-xl shadow">
                <h3 className="text-lg font-semibold mb-4">Population Growth Rate (%)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={filteredData.filter(item => item.PopulationGrowthRate)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="YEAR" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="PopulationGrowthRate" 
                      stroke="#68D391" 
                      strokeWidth={2} 
                      dot={{ r: 3 }} 
                      name="Growth Rate (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Demographic Transition</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={demographicTransitionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="BirthRate" 
                      stroke="#4C51BF" 
                      name="Birth Rate"
                      strokeWidth={2}
                    />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="DeathRate" 
                      stroke="#FC8181" 
                      name="Death Rate"
                      strokeWidth={2}
                    />
                    <Area 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="NaturalGrowth" 
                      fill="#B794F4" 
                      stroke="#9F7AEA" 
                      name="Natural Growth"
                      fillOpacity={0.3}
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="LifeExpectancy" 
                      stroke="#68D391" 
                      name="Life Expectancy"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow">
                <h3 className="text-lg font-semibold mb-4">Fertility Rate</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={healthData.filter(item => item['Fertility Rate'])}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="Fertility Rate" 
                      stroke="#F6AD55" 
                      fill="#F6AD55" 
                      fillOpacity={0.3} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow">
                <h3 className="text-lg font-semibold mb-4">Infant Mortality Rate</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={healthData.filter(item => item['Infant Mortality'])}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => (value * 10).toFixed(1)} />
                    <Line 
                      type="monotone" 
                      dataKey="Infant Mortality" 
                      stroke="#FC8181" 
                      strokeWidth={2} 
                      name="Infant Mortality Rate"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-center text-sm text-gray-500 mt-2">
                  *Values shown per 1,000 live births
                </p>
              </div>
            </>
          )}
          
          {/* Economy Tab */}
          {activeTab === 'economy' && (
            <>
              <div className="bg-white p-4 rounded-xl shadow">
                <h3 className="text-lg font-semibold mb-4">GDP Growth (Billions USD)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={economicData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="GDP (Billions USD)" 
                      stroke="#4C51BF" 
                      fill="#4C51BF" 
                      fillOpacity={0.3} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow">
                <h3 className="text-lg font-semibold mb-4">GDP Per Capita Growth</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={economicData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value.toLocaleString()}`} />
                    <Line 
                      type="monotone" 
                      dataKey="GDP Per Capita" 
                      stroke="#F6AD55" 
                      strokeWidth={2} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">GDP vs Population Growth</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={economicData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      yAxisId="left" 
                      dataKey="GDP (Billions USD)" 
                      fill="#4C51BF" 
                      name="GDP (Billions USD)" 
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="Population (Millions)" 
                      stroke="#F6AD55" 
                      strokeWidth={2} 
                      name="Population (Millions)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
          
          {/* Urbanization Tab */}
          {activeTab === 'urbanization' && (
            <>
              <div className="bg-white p-4 rounded-xl shadow">
                <h3 className="text-lg font-semibold mb-4">Urban vs Rural Population (Millions)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={urbanRuralData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    stackOffset="expand"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="Urban" 
                      stackId="1" 
                      stroke="#4C51BF" 
                      fill="#4C51BF" 
                      fillOpacity={0.6} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Rural" 
                      stackId="1" 
                      stroke="#68D391" 
                      fill="#68D391" 
                      fillOpacity={0.6} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow">
                <h3 className="text-lg font-semibold mb-4">Urbanization Rate (%)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={urbanRuralData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="UrbanPercentage" 
                      stroke="#4C51BF" 
                      strokeWidth={2} 
                      name="Urban (%)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="RuralPercentage" 
                      stroke="#68D391" 
                      strokeWidth={2} 
                      name="Rural (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow">
                <h3 className="text-lg font-semibold mb-4">Urban vs Rural Distribution</h3>
                {urbanRuralPieData.length > 0 && (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={urbanRuralPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {urbanRuralPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => value.toLocaleString()} />
                      </PieChart>
                    </ResponsiveContainer>
                    <p className="text-center text-sm text-gray-500 mt-2">
                      Latest data from {latestYear?.YEAR || ''}
                    </p>
                  </>
                )}
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow">
                <h3 className="text-lg font-semibold mb-4">Urban Population Growth</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={urbanRuralData.filter((_, i) => i % 5 === 0)} // Sample every 5th year for cleaner display
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Urban" name="Urban Population (M)" fill="#4C51BF" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
          
          {/* Health Indicators Tab */}
          {activeTab === 'health' && (
            <>
              <div className="bg-white p-4 rounded-xl shadow">
                <h3 className="text-lg font-semibold mb-4">Life Expectancy</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={healthData.filter(item => item['Life Expectancy'])}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="Life Expectancy" 
                      stroke="#4C51BF" 
                      strokeWidth={2} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow">
                <h3 className="text-lg font-semibold mb-4">Birth Rate and Death Rate</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={healthData.filter(item => item['Birth Rate'] && item['Death Rate'])}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="Birth Rate" 
                      stroke="#4C51BF" 
                      strokeWidth={2} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Death Rate" 
                      stroke="#FC8181" 
                      strokeWidth={2} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
        
        {/* Time range slider */}
        <div className="mb-6 p-4 bg-white rounded-xl shadow">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-semibold">Time Range: {timeRange.start} - {timeRange.end}</h2>
            </div>
            <div className="text-gray-500 text-sm">
              Showing {filteredData.length} data points
            </div>
          </div>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Start Year</label>
              <input
                type="range"
                name="start"
                min="1950"
                max="2025"
                value={timeRange.start}
                onChange={handleRangeChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1950</span>
                <span>2025</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow">
            <div className="flex justify-between items-center">
              <h3 className="text-gray-500 text-sm font-medium">Population Growth</h3>
              <div className={`p-2 rounded-full ${populationTrend.trend === 'up' ? 'bg-green-100' : 'bg-red-100'}`}>
                {populationTrend.trend === 'up' ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
              </div>
            </div>
            <div className="mt-2">
              <p className="text-3xl font-bold">{populationTrend.absolute}M</p>
              <p className={`text-sm ${populationTrend.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {populationTrend.trend === 'up' ? '+' : ''}{populationTrend.percent}% 
                <span className="text-gray-500 ml-1">during period</span>
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow">
            <div className="flex justify-between items-center">
              <h3 className="text-gray-500 text-sm font-medium">Urbanization Rate</h3>
              <div className="p-2 rounded-full bg-blue-100">
                <Home className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            {urbanRuralData.length > 0 && (
              <div className="mt-2">
                <p className="text-3xl font-bold">
                  {urbanRuralData[urbanRuralData.length - 1].UrbanPercentage.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">
                  Urban population in {urbanRuralData[urbanRuralData.length - 1].year}
                </p>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow">
            <div className="flex justify-between items-center">
              <h3 className="text-gray-500 text-sm font-medium">Life Expectancy</h3>
              <div className="p-2 rounded-full bg-purple-100">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            {healthData.length > 0 && (
              <div className="mt-2">
                <p className="text-3xl font-bold">
                  {healthData[healthData.length - 1]['Life Expectancy']?.toFixed(1) || 'N/A'}
                </p>
                <p className="text-sm text-gray-500">
                  Years in {healthData[healthData.length - 1].year}
                </p>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow">
            <div className="flex justify-between items-center">
              <h3 className="text-gray-500 text-sm font-medium">GDP Per Capita</h3>
              <div className="p-2 rounded-full bg-yellow-100">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            {economicData.length > 0 && (
              <div className="mt-2">
                <p className="text-3xl font-bold">
                  ${economicData[economicData.length - 1]['GDP Per Capita']?.toLocaleString() || 'N/A'}
                </p>
                <p className="text-sm text-gray-500">
                  USD in {economicData[economicData.length - 1].year}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Dashboard Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('population')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'population'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Population Trends
              </button>
              <button
                onClick={() => setActiveTab('urbanization')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'urbanization'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Urbanization
              </button>
              <button
                onClick={() => setActiveTab('health')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'health'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Health Indicators
              </button>
              <button
                onClick={() => setActiveTab('economy')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'economy'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Economy & Development
              </button>
              <button
                onClick={() => setActiveTab('correlations')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'correlations'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Correlations
              </button>
            </nav>
          </div>
        </div>-between text-xs text-gray-500 mt-1">
                <span>1950</span>
                <span>2025</span>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">End Year</label>
              <input
                type="range"
                name="end"
                min="1950"
                max="2025"
                value={timeRange.end}
                onChange={handleRangeChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify