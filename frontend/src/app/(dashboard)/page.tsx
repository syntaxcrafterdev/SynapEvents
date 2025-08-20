import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Users, Trophy, Clock } from 'lucide-react'

export default function DashboardPage() {
  // Mock data - replace with actual data from your API
  const stats = [
    { name: 'Upcoming Events', value: '5', icon: Calendar },
    { name: 'Team Members', value: '8', icon: Users },
    { name: 'Hackathons Won', value: '3', icon: Trophy },
    { name: 'Hours Spent', value: '247', icon: Clock },
  ]

  // Mock upcoming events
  const upcomingEvents = [
    {
      id: 1,
      name: 'Global Hack Week',
      date: '2023-11-15',
      location: 'Online',
      team: 'SynapSquad',
    },
    {
      id: 2,
      name: 'TechCrunch Disrupt',
      date: '2023-12-01',
      location: 'San Francisco, CA',
      team: 'CodeCrafters',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your events.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Upcoming Events */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <h3 className="font-medium">{event.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.date).toLocaleDateString()} • {event.location}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Team: {event.team}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" size="lg">
              Create New Event
            </Button>
            <Button className="w-full" size="lg" variant="outline">
              Join a Team
            </Button>
            <Button className="w-full" size="lg" variant="outline">
              Submit Project
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
